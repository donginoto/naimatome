-- ═══════════════════════════════════════════════
-- 탭 추가분: 그림체(styles) · 캐릭터(characters)
-- SQL Editor에 통째로 붙여넣고 Run 하세요.
-- 기존 artists 표는 건드리지 않습니다.
-- ═══════════════════════════════════════════════

-- ── 그림체 ──────────────────────────────────────
create table if not exists public.styles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  image_url text,
  file_name text,
  prompt text,
  undesired_prompt text,
  tags text[] default '{}',
  note text,
  created_at timestamptz default now()
);

alter table public.styles enable row level security;

drop policy if exists "anyone can read styles" on public.styles;
create policy "anyone can read styles" on public.styles for select using (true);

drop policy if exists "logged in can insert styles" on public.styles;
create policy "logged in can insert styles" on public.styles
  for insert to authenticated with check (true);

drop policy if exists "logged in can update styles" on public.styles;
create policy "logged in can update styles" on public.styles
  for update to authenticated using (true);

drop policy if exists "logged in can delete styles" on public.styles;
create policy "logged in can delete styles" on public.styles
  for delete to authenticated using (true);

grant select on public.styles to anon;
grant select, insert, update, delete on public.styles to authenticated;

-- ── 캐릭터 ──────────────────────────────────────
create table if not exists public.characters (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prompt text not null default '',
  image_url text,
  extra_images text[] default '{}',
  tags text[] default '{}',
  note text,
  created_at timestamptz default now()
);

alter table public.characters enable row level security;

drop policy if exists "anyone can read characters" on public.characters;
create policy "anyone can read characters" on public.characters for select using (true);

drop policy if exists "logged in can insert characters" on public.characters;
create policy "logged in can insert characters" on public.characters
  for insert to authenticated with check (true);

drop policy if exists "logged in can update characters" on public.characters;
create policy "logged in can update characters" on public.characters
  for update to authenticated using (true);

drop policy if exists "logged in can delete characters" on public.characters;
create policy "logged in can delete characters" on public.characters
  for delete to authenticated using (true);

grant select on public.characters to anon;
grant select, insert, update, delete on public.characters to authenticated;

-- ── 원본 그림 저장소 (메타데이터 보존용) ────────
-- 그림체 탭 이미지는 이 저장소에 원본 그대로 올라갑니다.
insert into storage.buckets (id, name, public)
values ('originals', 'originals', true)
on conflict (id) do nothing;

drop policy if exists "anyone can view originals" on storage.objects;
create policy "anyone can view originals"
  on storage.objects for select using (bucket_id = 'originals');

drop policy if exists "logged in can upload originals" on storage.objects;
create policy "logged in can upload originals"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'originals');

drop policy if exists "logged in can delete originals" on storage.objects;
create policy "logged in can delete originals"
  on storage.objects for delete to authenticated
  using (bucket_id = 'originals');
