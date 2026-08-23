"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Artist } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

/** 복사되는 문자열 — 프롬프트에 이어붙이기 좋게 뒤에 쉼표와 공백을 둔다 */
const copyText = (artist: string) => `${artist}, `;

async function writeClipboard(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    document.execCommand("copy");
    document.body.removeChild(ta);
  }
}

/** 파일 하나를 artworks 저장소에 올리고 공개 주소를 돌려준다 */
async function uploadOne(file: File) {
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from("artworks")
    .upload(path, file, { cacheControl: "31536000", upsert: false });
  if (error) throw error;
  return supabase.storage.from("artworks").getPublicUrl(path).data.publicUrl;
}

/* ══════════════════════════════════════
   복사 버튼
   ══════════════════════════════════════ */
function StampButton({ artist }: { artist: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);
  const text = copyText(artist);

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      className="stamp-btn"
      data-copied={copied}
      onClick={async (e) => {
        e.stopPropagation();
        await writeClipboard(text);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 650);
      }}
    >
      <span className="label">{text}</span>
      <span className="hint">눌러서 복사</span>
      <span className="slam">복사됨</span>
    </button>
  );
}

/* ══════════════════════════════════════
   로그인
   ══════════════════════════════════════ */
function LoginSheet({ onClose }: { onClose: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg("들어갈 수 없습니다. 이메일과 비밀번호를 확인하세요.");
      setBusy(false);
      return;
    }
    onClose();
  }

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <h2>관리자 로그인</h2>
        <div className="field">
          <label htmlFor="em">이메일</label>
          <input
            id="em"
            type="email"
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
          />
        </div>
        <div className="field">
          <label htmlFor="pw">비밀번호</label>
          <input
            id="pw"
            type="password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && signIn()}
          />
        </div>
        <div className="sheet-actions">
          <button className="btn btn-solid" onClick={signIn} disabled={busy}>
            {busy ? "여는 중" : "들어가기"}
          </button>
          <button className="btn" onClick={onClose} disabled={busy}>
            취소
          </button>
        </div>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════
   카드
   ══════════════════════════════════════ */
function Card({
  item,
  onTag,
  onEdit,
  onOpen,
  canEdit,
}: {
  item: Artist;
  onTag: (t: string) => void;
  onEdit: (a: Artist) => void;
  onOpen: (a: Artist) => void;
  canEdit: boolean;
}) {
  const extras = item.extra_images?.length ?? 0;

  return (
    <article className="card">
      <div className="card-frame" onClick={() => onOpen(item)}>
        {item.image_url ? (
          <img src={item.image_url} alt={item.artist} loading="lazy" />
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

      <StampButton artist={item.artist} />

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

/* ══════════════════════════════════════
   상세 보기
   ══════════════════════════════════════ */
function Viewer({ item, onClose }: { item: Artist; onClose: () => void }) {
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
          <h2>{item.artist}</h2>
          <button className="btn" onClick={onClose}>
            닫기
          </button>
        </div>

        <div className="viewer-body">
          <StampButton artist={item.artist} />

          {item.image_url && (
            <div className="viewer-main">
              <img src={item.image_url} alt={item.artist} />
            </div>
          )}

          {item.note && <p className="viewer-note">{item.note}</p>}

          {extras.length > 0 && (
            <>
              <p className="viewer-label">확인용 이미지 {extras.length}장</p>
              <div className="viewer-extras">
                {extras.map((src, i) => (
                  <a key={src + i} href={src} target="_blank" rel="noreferrer">
                    <img src={src} alt={`${item.artist} 확인용 ${i + 1}`} loading="lazy" />
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

/* ══════════════════════════════════════
   추가 / 수정
   ══════════════════════════════════════ */
function Sheet({
  draft,
  onClose,
  onSaved,
}: {
  draft: Partial<Artist>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [artist, setArtist] = useState(draft.artist ?? "");
  const [tags, setTags] = useState((draft.tags ?? []).join(", "));
  const [note, setNote] = useState(draft.note ?? "");
  const [imageUrl, setImageUrl] = useState(draft.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");

  // 확인용 이미지: 이미 올라간 주소 + 이번에 새로 고른 파일
  const [extraUrls, setExtraUrls] = useState<string[]>(draft.extra_images ?? []);
  const [extraFiles, setExtraFiles] = useState<File[]>([]);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isEdit = Boolean(draft.id);

  const extraPreviews = useMemo(
    () => extraFiles.map((f) => URL.createObjectURL(f)),
    [extraFiles]
  );

  async function save() {
    if (!artist.trim()) {
      setMsg("아티스트 이름을 넣어주세요.");
      return;
    }
    setBusy(true);
    setMsg("");

    try {
      let finalUrl = imageUrl;
      if (file) finalUrl = await uploadOne(file);

      const uploadedExtras = [];
      for (const f of extraFiles) uploadedExtras.push(await uploadOne(f));

      const payload = {
        artist: artist.trim(),
        image_url: finalUrl || null,
        extra_images: [...extraUrls, ...uploadedExtras],
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        note: note.trim() || null,
      };

      const { error } = isEdit
        ? await supabase.from("artists").update(payload).eq("id", draft.id)
        : await supabase.from("artists").insert(payload);
      if (error) throw error;

      onSaved();
    } catch (e: any) {
      setMsg("저장하지 못했습니다. " + (e?.message ?? ""));
      setBusy(false);
    }
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`${artist} 항목을 지웁니다. 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const { error } = await supabase.from("artists").delete().eq("id", draft.id);
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
          <label htmlFor="ar">아티스트</label>
          <input
            id="ar"
            type="text"
            value={artist}
            placeholder="ma0mao0"
            onChange={(e) => setArtist(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="tg">스타일 태그 · 쉼표로 구분</label>
          <input
            id="tg"
            type="text"
            value={tags}
            placeholder="SD, 반실사, 셀채색"
            onChange={(e) => setTags(e.target.value)}
          />
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
            placeholder="또는 이미지 주소 붙여넣기"
            onChange={(e) => setImageUrl(e.target.value)}
          />
          {shown && (
            <div className="preview">
              <img src={shown} alt="" />
            </div>
          )}
        </div>

        <div className="field">
          <label htmlFor="nt">메모</label>
          <textarea id="nt" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>

        <div className="field">
          <label>확인용 이미지 · 여러 장 가능</label>
          <label className="filepick">
            파일 고르기
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                const picked = Array.from(e.target.files ?? []);
                if (picked.length) setExtraFiles((prev) => [...prev, ...picked]);
                e.target.value = "";
              }}
            />
          </label>

          {(extraUrls.length > 0 || extraPreviews.length > 0) && (
            <div className="extra-edit">
              {extraUrls.map((src, i) => (
                <figure key={src}>
                  <img src={src} alt="" />
                  <button
                    onClick={() => setExtraUrls((prev) => prev.filter((_, k) => k !== i))}
                    aria-label="이 이미지 빼기"
                  >
                    ×
                  </button>
                </figure>
              ))}
              {extraPreviews.map((src, i) => (
                <figure key={src}>
                  <img src={src} alt="" />
                  <button
                    onClick={() => setExtraFiles((prev) => prev.filter((_, k) => k !== i))}
                    aria-label="이 이미지 빼기"
                  >
                    ×
                  </button>
                </figure>
              ))}
            </div>
          )}
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

/* ══════════════════════════════════════
   메인
   ══════════════════════════════════════ */
export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const canEdit = Boolean(session);

  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Artist> | null>(null);
  const [viewing, setViewing] = useState<Artist | null>(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("artists")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setLoadError(error.message);
    else {
      setLoadError("");
      setItems(data as Artist[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (ready) load();
  }, [ready, load]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    items.forEach((i) => i.tags?.forEach((t) => s.add(t)));
    return Array.from(s).sort((a, b) => a.localeCompare(b, "ko"));
  }, [items]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (q && !i.artist.toLowerCase().includes(q) && !(i.note ?? "").toLowerCase().includes(q))
        return false;
      return active.every((t) => i.tags?.includes(t));
    });
  }, [items, query, active]);

  function toggleTag(t: string) {
    setActive((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  if (!ready) return <div className="stage">여는 중</div>;

  return (
    <div className="shell">
      <header className="masthead">
        <p className="eyebrow">
          <span>NovelAI · Artist Index</span>
          {session ? (
            <button className="tag-clear" onClick={() => supabase.auth.signOut()}>
              나가기
            </button>
          ) : (
            <button className="tag-clear" onClick={() => setShowLogin(true)}>
              관리자 로그인
            </button>
          )}
        </p>
        <h1 className="wordmark">
          NAI
          <br />
          MATOME
        </h1>
        <div className="masthead-foot">
          <span className="count">
            {items.length}명 수록 · {allTags.length}개 스타일
          </span>
        </div>
      </header>

      <div className="controls">
        <input
          className="search"
          type="text"
          value={query}
          placeholder="아티스트 찾기"
          onChange={(e) => setQuery(e.target.value)}
        />
        {canEdit && (
          <button className="btn btn-solid" onClick={() => setDraft({})}>
            추가
          </button>
        )}
      </div>

      {allTags.length > 0 && (
        <div className="setlist">
          <span className="setlist-label">스타일</span>
          {allTags.map((t) => (
            <button
              key={t}
              className="tag-btn"
              data-on={active.includes(t)}
              onClick={() => toggleTag(t)}
            >
              {t}
            </button>
          ))}
          {active.length > 0 && (
            <button className="tag-clear" onClick={() => setActive([])}>
              전체 보기
            </button>
          )}
        </div>
      )}

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
          {items.length === 0
            ? canEdit
              ? "추가를 눌러 첫 아티스트를 넣으세요"
              : "아직 등록된 아티스트가 없습니다"
            : "조건을 줄여보세요"}
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

      {showLogin && <LoginSheet onClose={() => setShowLogin(false)} />}
    </div>
  );
}
