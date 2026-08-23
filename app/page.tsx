"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase, type Artist } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

/* ══════════════════════════════════════
   로그인 화면
   ══════════════════════════════════════ */
function Gate() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setMsg("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setMsg("들어갈 수 없습니다. 이메일과 비밀번호를 확인하세요.");
    setBusy(false);
  }

  return (
    <div className="gate">
      <div className="gate-inner">
        <p className="eyebrow">
          <span>NovelAI · Artist Index</span>
        </p>
        <h1 className="wordmark">
          NAI
          <br />
          <em>VAULT</em>
        </h1>
        <div className="gate-rule" />

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

        <button className="btn btn-solid" style={{ width: "100%" }} onClick={signIn} disabled={busy}>
          {busy ? "여는 중" : "들어가기"}
        </button>
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
}: {
  item: Artist;
  onTag: (t: string) => void;
  onEdit: (a: Artist) => void;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);

  const text = `artist:${item.artist}`;

  async function copy() {
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
    setCopied(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 650);
  }

  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <article className="card">
      <div className="card-frame">
        {item.image_url ? (
          <img src={item.image_url} alt={item.artist} loading="lazy" />
        ) : (
          <div className="card-frame-empty">이미지 없음</div>
        )}
        <button className="card-edit" onClick={() => onEdit(item)}>
          고치기
        </button>
      </div>

      <button className="stamp-btn" data-copied={copied} onClick={copy}>
        <span>{text}</span>
        <span className="hint">눌러서 복사</span>
        <span className="slam">복사됨</span>
      </button>

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
   추가 / 수정 시트
   ══════════════════════════════════════ */
function Sheet({
  draft,
  onClose,
  onSaved,
}: {
  draft: Partial<Artist> | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [artist, setArtist] = useState(draft?.artist ?? "");
  const [tags, setTags] = useState((draft?.tags ?? []).join(", "));
  const [note, setNote] = useState(draft?.note ?? "");
  const [imageUrl, setImageUrl] = useState(draft?.image_url ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [localPreview, setLocalPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const isEdit = Boolean(draft?.id);

  function pickFile(f: File | undefined) {
    if (!f) return;
    setFile(f);
    setLocalPreview(URL.createObjectURL(f));
  }

  async function save() {
    if (!artist.trim()) {
      setMsg("아티스트 이름을 넣어주세요.");
      return;
    }
    setBusy(true);
    setMsg("");

    let finalUrl = imageUrl;

    if (file) {
      const ext = file.name.split(".").pop() || "png";
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from("artworks")
        .upload(path, file, { cacheControl: "31536000", upsert: false });
      if (upErr) {
        setMsg("이미지를 올리지 못했습니다. artworks 저장소가 만들어졌는지 확인하세요.");
        setBusy(false);
        return;
      }
      finalUrl = supabase.storage.from("artworks").getPublicUrl(path).data.publicUrl;
    }

    const payload = {
      artist: artist.trim(),
      image_url: finalUrl || null,
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      note: note.trim() || null,
    };

    const { error } = isEdit
      ? await supabase.from("artists").update(payload).eq("id", draft!.id)
      : await supabase.from("artists").insert(payload);

    if (error) {
      setMsg("저장하지 못했습니다. " + error.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    onSaved();
  }

  async function remove() {
    if (!isEdit) return;
    if (!confirm(`${artist} 항목을 지웁니다. 되돌릴 수 없습니다.`)) return;
    setBusy(true);
    const { error } = await supabase.from("artists").delete().eq("id", draft!.id);
    if (error) {
      setMsg("지우지 못했습니다. " + error.message);
      setBusy(false);
      return;
    }
    onSaved();
  }

  const shown = localPreview || imageUrl;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <h2>{isEdit ? "항목 고치기" : "새 항목"}</h2>

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
          <label>그림</label>
          <label className="filepick">
            {file ? file.name : "파일 고르기"}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => pickFile(e.target.files?.[0])}
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

  const [items, setItems] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string[]>([]);
  const [draft, setDraft] = useState<Partial<Artist> | null>(null);
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
    if (session) load();
  }, [session, load]);

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
  if (!session) return <Gate />;

  return (
    <div className="shell">
      <header className="masthead">
        <p className="eyebrow">
          <span>NovelAI · Artist Index</span>
          <button className="tag-clear" onClick={() => supabase.auth.signOut()}>
            나가기
          </button>
        </p>
        <h1 className="wordmark">
          NAI
          <br />
          <em>VAULT</em>
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
        <button className="btn btn-solid" onClick={() => setDraft({})}>
          새 항목
        </button>
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
          {items.length === 0 ? "새 항목을 눌러 첫 아티스트를 넣으세요" : "조건을 줄여보세요"}
        </div>
      ) : (
        <div className="grid">
          {shown.map((i) => (
            <Card key={i.id} item={i} onTag={toggleTag} onEdit={setDraft} />
          ))}
        </div>
      )}

      {draft && (
        <Sheet
          draft={draft}
          onClose={() => setDraft(null)}
          onSaved={() => {
            setDraft(null);
            load();
          }}
        />
      )}
    </div>
  );
}
