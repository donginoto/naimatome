-- ① 표 만들기
create table if not exists public.artists (
  id uuid primary key default gen_random_uuid(),
  artist text not null,
  image_url text,
  tags text[] default '{}',
  note text,
  created_at timestamptz default now()
);

-- ② 로그인한 사람만 읽고 쓰게 하기
alter table public.artists enable row level security;

create policy "logged in can read"   on public.artists for select to authenticated using (true);
create policy "logged in can insert" on public.artists for insert to authenticated with check (true);
create policy "logged in can update" on public.artists for update to authenticated using (true);
create policy "logged in can delete" on public.artists for delete to authenticated using (true);

-- ③ 그림 저장소 만들기 (공개 읽기)
insert into storage.buckets (id, name, public)
values ('artworks', 'artworks', true)
on conflict (id) do nothing;

create policy "anyone can view artworks"
  on storage.objects for select using (bucket_id = 'artworks');

create policy "logged in can upload artworks"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'artworks');

create policy "logged in can delete artworks"
  on storage.objects for delete to authenticated
  using (bucket_id = 'artworks');

-- ── 나중에 추가: 갤러리는 누구나 보게, 편집은 로그인한 사람만 ──
drop policy if exists "logged in can read" on public.artists;

create policy "anyone can read" on public.artists
  for select
  using (true);

grant usage on schema public to anon;
grant select on public.artists to anon;

-- ── 추가 이미지(확인용) 칸 만들기 ──
alter table public.artists
  add column if not exists extra_images text[] default '{}';
