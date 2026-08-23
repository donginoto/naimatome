import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, key, {
  auth: { persistSession: true, autoRefreshToken: true },
});

export type Artist = {
  id: string;
  artist: string;
  image_url: string | null;
  extra_images: string[] | null;
  tags: string[];
  note: string | null;
  created_at: string;
};
