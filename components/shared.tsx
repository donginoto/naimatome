"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

/* ── 클립보드 ─────────────────────────── */
export async function writeClipboard(text: string) {
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

/* ── 메타데이터 제거 ──────────────────────
   캔버스로 다시 그린 뒤 JPEG로 인코딩한다.
   JPEG에는 알파 채널이 없으므로 알파에 숨겨진
   프롬프트 정보(stealth pnginfo)까지 사라진다.
   그림체 탭에서는 쓰지 않는다.
   ─────────────────────────────────────── */
export async function stripMetadata(file: File): Promise<File> {
  if (file.type === "image/gif") return file;

  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  const blob: Blob = await new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("변환 실패"))), "image/jpeg", 1.0)
  );

  const name = file.name.replace(/\.[^.]+$/, "") + ".jpg";
  return new File([blob], name, { type: "image/jpeg" });
}

/* ── 업로드 ───────────────────────────── */

/** 메타데이터를 지우고 artworks 저장소에 올린다 */
export async function uploadClean(file: File) {
  const safe = await stripMetadata(file);
  return rawUpload(safe, "artworks");
}

/** 원본 바이트 그대로 originals 저장소에 올린다 (프롬프트 보존) */
export async function uploadOriginal(file: File) {
  return rawUpload(file, "originals");
}

async function rawUpload(file: File, bucket: string) {
  const ext = file.name.split(".").pop() || "png";
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { cacheControl: "31536000", upsert: false, contentType: file.type });
  if (error) throw error;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

/** 저장된 원본을 바이트 손실 없이 그대로 내려받는다 */
export async function downloadOriginal(url: string, fileName?: string | null) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("내려받지 못했습니다");
  const blob = await res.blob();
  const objUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objUrl;
  a.download = fileName || url.split("/").pop() || "image.png";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(objUrl), 1000);
}

/* ── 복사 버튼 ────────────────────────── */
export function StampButton({
  label,
  value,
  hint = "눌러서 복사",
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <button
      className="stamp-btn"
      data-copied={copied}
      onClick={async (e) => {
        e.stopPropagation();
        await writeClipboard(value);
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 650);
      }}
    >
      <span className="label">{label}</span>
      <span className="hint">{hint}</span>
      <span className="slam">복사됨</span>
    </button>
  );
}

/* ── 코드블럭 ─────────────────────────── */
export function CodeBlock({ content, title }: { content: string; title?: string }) {
  const [copied, setCopied] = useState(false);
  const timer = useRef<any>(null);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <div className="note-code">
      {title && <p className="note-code-title">{title}</p>}
      <pre>{content}</pre>
      <button
        className="note-code-copy"
        data-copied={copied}
        onClick={async () => {
          await writeClipboard(content);
          setCopied(true);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setCopied(false), 900);
        }}
      >
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

/* ── 메모 (```는 코드블럭으로) ─────────── */
function parseNote(note: string): { type: "text" | "code"; content: string }[] {
  const parts: { type: "text" | "code"; content: string }[] = [];
  const re = /```([\s\S]*?)```/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(note)) !== null) {
    if (m.index > last) parts.push({ type: "text", content: note.slice(last, m.index) });
    parts.push({ type: "code", content: m[1].replace(/^\n/, "").replace(/\n$/, "") });
    last = re.lastIndex;
  }
  if (last < note.length) parts.push({ type: "text", content: note.slice(last) });
  return parts.filter((p) => p.content.trim().length > 0);
}

export function NoteView({ note }: { note: string }) {
  return (
    <div>
      {parseNote(note).map((p, i) =>
        p.type === "code" ? (
          <CodeBlock key={i} content={p.content} />
        ) : (
          <p key={i} className="viewer-note">
            {p.content.trim()}
          </p>
        )
      )}
    </div>
  );
}

/* ── 태그 필터 ────────────────────────── */
export function TagFilter({
  allTags,
  active,
  onToggle,
  onClear,
}: {
  allTags: string[];
  active: string[];
  onToggle: (t: string) => void;
  onClear: () => void;
}) {
  if (!allTags.length) return null;
  return (
    <div className="setlist">
      <span className="setlist-label">태그</span>
      {allTags.map((t) => (
        <button
          key={t}
          className="tag-btn"
          data-on={active.includes(t)}
          onClick={() => onToggle(t)}
        >
          {t}
        </button>
      ))}
      {active.length > 0 && (
        <button className="tag-clear" onClick={onClear}>
          전체 보기
        </button>
      )}
    </div>
  );
}

/* ── 확인용 이미지 편집칸 ─────────────── */
export function ExtraImagesField({
  urls,
  files,
  setUrls,
  setFiles,
}: {
  urls: string[];
  files: File[];
  setUrls: (f: (p: string[]) => string[]) => void;
  setFiles: (f: (p: File[]) => File[]) => void;
}) {
  const [previews, setPreviews] = useState<string[]>([]);
  useEffect(() => {
    const made = files.map((f) => URL.createObjectURL(f));
    setPreviews(made);
    return () => made.forEach((u) => URL.revokeObjectURL(u));
  }, [files]);

  return (
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
            if (picked.length) setFiles((prev) => [...prev, ...picked]);
            e.target.value = "";
          }}
        />
      </label>

      {(urls.length > 0 || previews.length > 0) && (
        <div className="extra-edit">
          {urls.map((src, i) => (
            <figure key={src}>
              <img src={src} alt="" />
              <button onClick={() => setUrls((p) => p.filter((_, k) => k !== i))}>×</button>
            </figure>
          ))}
          {previews.map((src, i) => (
            <figure key={src}>
              <img src={src} alt="" />
              <button onClick={() => setFiles((p) => p.filter((_, k) => k !== i))}>×</button>
            </figure>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── 로그인 ───────────────────────────── */
export function LoginSheet({ onClose }: { onClose: () => void }) {
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
