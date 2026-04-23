create extension if not exists "pgcrypto";

create table if not exists public.dashboard_wishes (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null default 'shared',
  destination_name text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  note text,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists dashboard_wishes_owner_created_at_idx
  on public.dashboard_wishes (owner_id, created_at desc);

alter table public.dashboard_wishes enable row level security;

drop policy if exists "Public read dashboard wishes" on public.dashboard_wishes;
create policy "Public read dashboard wishes"
  on public.dashboard_wishes
  for select
  using (true);

drop policy if exists "Public insert dashboard wishes" on public.dashboard_wishes;
create policy "Public insert dashboard wishes"
  on public.dashboard_wishes
  for insert
  with check (true);

drop policy if exists "Public update dashboard wishes" on public.dashboard_wishes;
create policy "Public update dashboard wishes"
  on public.dashboard_wishes
  for update
  using (true)
  with check (true);

drop policy if exists "Public delete dashboard wishes" on public.dashboard_wishes;
create policy "Public delete dashboard wishes"
  on public.dashboard_wishes
  for delete
  using (true);
