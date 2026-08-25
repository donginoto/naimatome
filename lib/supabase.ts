import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

/** 작가 태그 */
export type Artist = {
  id: string;
  artist: string;
  image_url: string | null;
  extra_images: string[] | null;
  tags: string[];
  note: string | null;
  created_at: string;
};

/** 그림체 — 프롬프트가 든 원본 이미지를 그대로 보관 */
export type Style = {
  id: string;
  title: string;
  image_url: string | null;
  file_name: string | null;
  prompt: string | null;
  undesired_prompt: string | null;
  tags: string[];
  note: string | null;
  created_at: string;
};

/** 캐릭터 프롬프트 */
export type Character = {
  id: string;
  name: string;
  prompt: string;
  image_url: string | null;
  extra_images: string[] | null;
  tags: string[];
  note: string | null;
  created_at: string;
};
