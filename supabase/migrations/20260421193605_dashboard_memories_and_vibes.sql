create extension if not exists "pgcrypto";

create table if not exists public.dashboard_memories (
  id uuid primary key default gen_random_uuid(),
  memory_date date not null,
  title text,
  description text,
  image_url text not null,
  location_name text not null,
  location_lat double precision not null,
  location_lng double precision not null,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_memories_created_at_idx
  on public.dashboard_memories (created_at desc);

create table if not exists public.dashboard_vibes (
  day_key date not null,
  person text not null check (person in ('marija', 'aco')),
  emoji text not null,
  note text not null default '',
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (day_key, person)
);

create index if not exists dashboard_vibes_day_key_idx
  on public.dashboard_vibes (day_key desc);

alter table public.dashboard_memories enable row level security;
alter table public.dashboard_vibes enable row level security;

drop policy if exists "Public read memories" on public.dashboard_memories;
create policy "Public read memories"
  on public.dashboard_memories
  for select
  using (true);

drop policy if exists "Public insert memories" on public.dashboard_memories;
create policy "Public insert memories"
  on public.dashboard_memories
  for insert
  with check (true);

drop policy if exists "Public read vibes" on public.dashboard_vibes;
create policy "Public read vibes"
  on public.dashboard_vibes
  for select
  using (true);

drop policy if exists "Public insert vibes" on public.dashboard_vibes;
create policy "Public insert vibes"
  on public.dashboard_vibes
  for insert
  with check (true);

drop policy if exists "Public update vibes" on public.dashboard_vibes;
create policy "Public update vibes"
  on public.dashboard_vibes
  for update
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dashboard-memories',
  'dashboard-memories',
  true,
  10485760,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read memory images" on storage.objects;
create policy "Public read memory images"
  on storage.objects
  for select
  using (bucket_id = 'dashboard-memories');

drop policy if exists "Public upload memory images" on storage.objects;
create policy "Public upload memory images"
  on storage.objects
  for insert
  with check (bucket_id = 'dashboard-memories');
