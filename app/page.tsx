"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { LoginSheet } from "@/components/shared";
import ArtistsTab from "@/components/ArtistsTab";
import StylesTab from "@/components/StylesTab";
import CharactersTab from "@/components/CharactersTab";

type TabKey = "artists" | "styles" | "characters";

const TABS: { key: TabKey; label: string }[] = [
  { key: "artists", label: "작가 태그" },
  { key: "styles", label: "그림체" },
  { key: "characters", label: "캐릭터" },
];

export default function Page() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<TabKey>("artists");
  const [meta, setMeta] = useState({ n: 0, tags: 0 });

  const canEdit = Boolean(session);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  // 탭을 옮기면 집계를 초기화해 이전 탭 숫자가 남지 않게 한다
  useEffect(() => {
    setMeta({ n: 0, tags: 0 });
  }, [tab]);

  const onCount = useCallback((n: number, tags: number) => setMeta({ n, tags }), []);

  if (!ready) return <div className="stage">여는 중</div>;

  return (
    <div className="shell">
      <header className="masthead">
        <p className="eyebrow">
          <span>NovelAI · Prompt Index</span>
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
            {meta.n}개 수록 · {meta.tags}개 태그
          </span>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className="tab"
            data-on={tab === t.key}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === "artists" && <ArtistsTab canEdit={canEdit} onCount={onCount} />}
      {tab === "styles" && <StylesTab canEdit={canEdit} onCount={onCount} />}
      {tab === "characters" && <CharactersTab canEdit={canEdit} onCount={onCount} />}

      {showLogin && <LoginSheet onClose={() => setShowLogin(false)} />}
    </div>
  );
}
