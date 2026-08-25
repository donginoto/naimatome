"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase, type Character } from "@/lib/supabase";
import {
  StampButton,
  CodeBlock,
  NoteView,
  TagFilter,
  ExtraImagesField,
  uploadClean,
} from "./shared";

/* ── 카드 ─────────────────────────────── */
function Card({
  item,
  onTag,
  onEdit,
  onOpen,
  canEdit,
}: {
  item: Character;
  onTag: (t: string) => void;
  onEdit: (c: Character) => void;
  onOpen: (c: Character) => void;
  canEdit: boolean;
}) {
  const extras = item.extra_images?.length ?? 0;
  return (
    <article className="card">
      <div className="card-frame" onClick={() => onOpen(item)}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.name} loading="lazy" />
        ) : (
          <div className="card-frame-empty">이미지 없음</div>
        )}
        {extras > 0 && <span className="extra-flag">+{extras}</span>}
        {canEdit && (
          <button
            className="card-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
          >
            수정
          </button>
        )}
      </div>

      {/* 버튼에는 이름이 뜨고, 누르면 프롬프트가 복사된다 */}
      <StampButton label={item.name} value={item.prompt} />

      {item.tags?.length > 0 && (
        <div className="card-tags">
          {item.tags.map((t) => (
            <button key={t} className="card-tag" onClick={() => onTag(t)}>
              {t}
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

/* ── 상세 ─────────────────────────────── */
function Viewer({ item, onClose }: { item: Character; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const extras = item.extra_images ?? [];

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer">
        <div className="viewer-head">
          <h2>{item.name}</h2>
          <button className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="viewer-body">
          <StampButton label={item.name} value={item.prompt} />

          {item.image_url && (
            <div className="viewer-main">
              <img src={item.image_url} alt={item.name} />
            </div>
          )}

          {item.prompt && <CodeBlock title="Prompt" content={item.prompt} />}
          {item.note && <NoteView note={item.note} />}

          {extras.length > 0 && (
            <>
              <p className="viewer-label">확인용 이미지 {extras.length}장</p>
              <div className="viewer-extras">
                {extras.map((src, i) => (
                  <a key={src + i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt="" loading="lazy" />
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── 추가 / 수정 ──────────────────────── */
function Sheet({
  draft,
  onClose,
  onSaved,
}: {
  draft: Partial<Character>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(draft.name ?? "");
  const [prompt, setPrompt] = useState(draft.prompt ?? "");
  const [tags, setTags] = useState((draft.tags ?? []).join(", "));
  const [note, setNote] = useState(draft.note ?? "");
  const [imageUrl, setImageUrl] = useState(draft.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [extraUrls, setExtraUrls] = useState<string[]>(draft.extra_images ?? []);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isEdit = Boolean(draft.id);

  async function save() {
    if (!name.trim()) {
      setMsg("이름을 넣어주세요.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      let finalUrl = imageUrl;
      if (file) finalUrl = await uploadClean(file);

      const uploaded: string[] = [];
      for (const f of extraFiles) uploaded.push(await uploadClean(f));

      const payload = {
        name: name.trim(),
        prompt: prompt.trim(),
        image_url: finalUrl || null,
        extra_images: [...extraUrls, ...uploaded],
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        note: note.trim() || null,
      };

      const { error } = isEdit
        ? await supabase.from("characters").update(payload).eq("id", draft.id)
        : await supabase.from("characters").insert(payload);
      if (error) throw error;
      onSaved();
    } catch (e: any) {
      setMsg("저장하지 못했습니다. " + (e?.message ?? ""));
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`${name} 항목을 지웁니다. 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const { error } = await supabase.from("characters").delete().eq("id", draft.id);
    if (error) {
      setMsg("지우지 못했습니다. " + error.message);
      setBusy(false);
      return;
    }
    onSaved();
  }

  const shown = localPreview || imageUrl;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div className="sheet">
        <h2>{isEdit ? "수정" : "추가"}</h2>

        <div className="field">
          <label htmlFor="cn">이름 · 버튼에 표시됩니다</label>
          <input id="cn" type="text" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="cp">프롬프트 · 버튼을 누르면 이게 복사됩니다</label>
          <textarea id="cp" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="ctg">태그 · 쉼표로 구분</label>
          <input id="ctg" type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="field">
          <label>대표 그림 · 썸네일</label>
          <label className="filepick">
            {file ? file.name : "파일 고르기"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                setFile(f);
                setLocalPreview(URL.createObjectURL(f));
              }}
            />
          </label>
          <input
            type="text"
            style={{ marginTop: 8 }}
            value={file ? "" : imageUrl}
            disabled={Boolean(file)}
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {shown && (
            <div className="preview">
              <img src={shown} alt="" />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="cnt">메모</label>
          <textarea id="cnt" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <ExtraImagesField
          urls={extraUrls}
          files={extraFiles}
          setUrls={setExtraUrls}
          setFiles={setExtraFiles}
        />

        <div className="sheet-actions">
          <button className="btn btn-solid" onClick={save} disabled={busy}>
            {busy ? "저장 중" : "저장"}
          </button>
          <button className="btn" onClick={onClose} disabled={busy}>
            취소
          </button>
          {isEdit && (
            <button className="btn danger" onClick={remove} disabled={busy}>
              지우기
            </button>
          )}
        </div>

        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  );
}

/* ── 탭 본체 ──────────────────────────── */
export default function CharactersTab({
  canEdit,
  onCount,
}: {
  canEdit: boolean;
  onCount: (n: number, tags: number) => void;
}) {
  const [items, setItems] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Character> | null>(null);
  const [viewing, setViewing] = useState<Character | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setLoadError(error.message);
    else {
      setLoadError("");
      setItems(data as Character[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
  }, [items]);

  useEffect(() => {
    onCount(items.length, allTags.length);
  }, [items.length, allTags.length, onCount]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (
        q &&
        !i.name.toLowerCase().includes(q) &&
        !i.prompt.toLowerCase().includes(q) &&
        !(i.note ?? "").toLowerCase().includes(q)
      )
        return false;
      return active.every((t) => i.tags?.includes(t));
    });
  }, [items, query, active]);

  function toggleTag(t: string) {
    setActive((p) => (p.includes(t) ? p.filter((x) => x !== t) : [...p, t]));
  }

  return (
    <>
      <div className="controls">
        <input
          className="search"
          type="text"
          value={query}
          placeholder="캐릭터 찾기"
          onChange={(e) => setQuery(e.target.value)}
        />
        {canEdit && (
          <button className="btn btn-solid" onClick={() => setDraft({})}>
            추가
          </button>
        )}
      </div>

      <TagFilter
        allTags={allTags}
        active={active}
        onToggle={toggleTag}
        onClear={() => setActive([])}
      />

      {loadError ? (
        <div className="stage">
          <strong>연결되지 않았습니다</strong>
          {loadError}
        </div>
      ) : loading ? (
        <div className="stage">불러오는 중</div>
      ) : shown.length === 0 ? (
        <div className="stage">
          <strong>{items.length === 0 ? "아직 비어 있습니다" : "찾은 항목이 없습니다"}</strong>
          {items.length === 0 ? "" : "조건을 줄여보세요"}
        </div>
      ) : (
        <div className="grid">
          {shown.map((i) => (
            <Card
              key={i.id}
              item={i}
              onTag={toggleTag}
              onEdit={setDraft}
              onOpen={setViewing}
              canEdit={canEdit}
            />
          ))}
        </div>
      )}

      {viewing && <Viewer item={viewing} onClose={() => setViewing(null)} />}
      {canEdit && draft && (
        <Sheet
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </>
  );
}
