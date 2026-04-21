create table if not exists public.dashboard_media_settings (
  id text primary key,
  hero_image_url text,
  marija_avatar_url text,
  aco_avatar_url text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.dashboard_media_settings enable row level security;

drop policy if exists "Public read dashboard media settings" on public.dashboard_media_settings;
create policy "Public read dashboard media settings"
  on public.dashboard_media_settings
  for select
  using (true);

drop policy if exists "Public insert dashboard media settings" on public.dashboard_media_settings;
create policy "Public insert dashboard media settings"
  on public.dashboard_media_settings
  for insert
  with check (true);

drop policy if exists "Public update dashboard media settings" on public.dashboard_media_settings;
create policy "Public update dashboard media settings"
  on public.dashboard_media_settings
  for update
  using (true)
  with check (true);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dashboard-media',
  'dashboard-media',
  true,
  10485760,
  null
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public read dashboard media assets" on storage.objects;
create policy "Public read dashboard media assets"
  on storage.objects
  for select
  using (bucket_id = 'dashboard-media');

drop policy if exists "Public upload dashboard media assets" on storage.objects;
create policy "Public upload dashboard media assets"
  on storage.objects
  for insert
  with check (bucket_id = 'dashboard-media');
