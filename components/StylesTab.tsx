"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Style } from "@/lib/supabase";
import {
  CodeBlock,
  NoteView,
  TagFilter,
  uploadOriginal,
  downloadOriginal,
} from "./shared";

/* ── 원본 내려받기 버튼 ───────────────── */
function DownloadButton({ item, wide = false }: { item: Style; wide?: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "fail">("idle");
  const timer = useRef<any>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  if (!item.image_url) return null;

  const text =
    state === "busy" ? "받는 중" : state === "done" ? "받음" : state === "fail" ? "실패" : "원본 받기";

  return (
    <button
      className="stamp-btn"
      data-copied={state === "done"}
      onClick={async (e) => {
        e.stopPropagation();
        setState("busy");
        try {
          await downloadOriginal(item.image_url!, item.file_name);
          setState("done");
        } catch {
          setState("fail");
        }
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setState("idle"), 1200);
      }}
    >
      <span className="label">{text}</span>
      {wide && <span className="hint">메타데이터 포함</span>}
      <span className="slam">받음</span>
    </button>
  );
}

/* ── 카드 ─────────────────────────────── */
function Card({
  item,
  onTag,
  onEdit,
  onOpen,
  canEdit,
}: {
  item: Style;
  onTag: (t: string) => void;
  onEdit: (s: Style) => void;
  onOpen: (s: Style) => void;
  canEdit: boolean;
}) {
  return (
    <article className="card">
      <div className="card-frame" onClick={() => onOpen(item)}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.title} loading="lazy" />
        ) : (
          <div className="card-frame-empty">이미지 없음</div>
        )}
        <span className="title-flag">{item.title}</span>
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

      <DownloadButton item={item} />

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
function Viewer({ item, onClose }: { item: Style; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="viewer">
        <div className="viewer-head">
          <h2>{item.title}</h2>
          <button className="btn" onClick={onClose}>
            닫기
          </button>
        </div>
        <div className="viewer-body">
          <DownloadButton item={item} wide />

          {item.image_url && (
            <div className="viewer-main">
              <img src={item.image_url} alt={item.title} />
            </div>
          )}

          {item.prompt && <CodeBlock title="Prompt" content={item.prompt} />}
          {item.undesired_prompt && (
            <CodeBlock title="Undesired Prompt" content={item.undesired_prompt} />
          )}

          {item.note && <NoteView note={item.note} />}
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
  draft: Partial<Style>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [title, setTitle] = useState(draft.title ?? "");
  const [tags, setTags] = useState((draft.tags ?? []).join(", "));
  const [prompt, setPrompt] = useState(draft.prompt ?? "");
  const [undesired, setUndesired] = useState(draft.undesired_prompt ?? "");
  const [note, setNote] = useState(draft.note ?? "");
  const [imageUrl, setImageUrl] = useState(draft.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isEdit = Boolean(draft.id);

  async function save() {
    if (!title.trim()) {
      setMsg("이름을 넣어주세요.");
      return;
    }
    setBusy(true);
    setMsg("");
    try {
      let finalUrl = imageUrl;
      let fileName = draft.file_name ?? null;
      if (file) {
        finalUrl = await uploadOriginal(file); // 메타데이터를 지우지 않는다
        fileName = file.name;
      }

      const payload = {
        title: title.trim(),
        image_url: finalUrl || null,
        file_name: fileName,
        prompt: prompt.trim() || null,
        undesired_prompt: undesired.trim() || null,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        note: note.trim() || null,
      };

      const { error } = isEdit
        ? await supabase.from("styles").update(payload).eq("id", draft.id)
        : await supabase.from("styles").insert(payload);
      if (error) throw error;
      onSaved();
    } catch (e: any) {
      setMsg("저장하지 못했습니다. " + (e?.message ?? ""));
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`${title} 항목을 지웁니다. 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const { error } = await supabase.from("styles").delete().eq("id", draft.id);
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
          <label htmlFor="st">이름</label>
          <input id="st" type="text" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="stg">태그 · 쉼표로 구분</label>
          <input id="stg" type="text" value={tags} onChange={(e) => setTags(e.target.value)} />
        </div>

        <div className="field">
          <label>그림 · 원본 그대로 저장됩니다</label>
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
          <p className="field-hint">
            이 탭의 그림은 메타데이터를 지우지 않습니다. 원본 PNG가 그대로 올라갑니다.
          </p>
          {shown && (
            <div className="preview">
              <img src={shown} alt="" />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="pr">Prompt</label>
          <textarea id="pr" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="up">Undesired Prompt</label>
          <textarea id="up" value={undesired} onChange={(e) => setUndesired(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="snt">메모</label>
          <textarea id="snt" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

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
export default function StylesTab({
  canEdit,
  onCount,
}: {
  canEdit: boolean;
  onCount: (n: number, tags: number) => void;
}) {
  const [items, setItems] = useState<Style[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Style> | null>(null);
  const [viewing, setViewing] = useState<Style | null>(null);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("styles")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setLoadError(error.message);
    else {
      setLoadError("");
      setItems(data as Style[]);
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
        !i.title.toLowerCase().includes(q) &&
        !(i.prompt ?? "").toLowerCase().includes(q) &&
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
          placeholder="그림체 찾기"
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
