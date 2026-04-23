alter table public.dashboard_memories
  add column if not exists shared_note text;

alter table public.dashboard_memories
  add column if not exists added_by text;

alter table public.dashboard_memories
  add column if not exists updated_at timestamptz;

update public.dashboard_memories
set
  added_by = coalesce(added_by, 'marija'),
  updated_at = coalesce(updated_at, created_at, now())
where added_by is null
   or updated_at is null;

alter table public.dashboard_memories
  alter column added_by set default 'marija';

alter table public.dashboard_memories
  alter column updated_at set default now();

alter table public.dashboard_memories
  drop constraint if exists dashboard_memories_added_by_check;

alter table public.dashboard_memories
  add constraint dashboard_memories_added_by_check
  check (added_by in ('marija', 'aco'));

create table if not exists public.dashboard_memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.dashboard_memories (id) on delete cascade,
  image_url text not null,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists dashboard_memory_photos_memory_sort_idx
  on public.dashboard_memory_photos (memory_id, sort_order, created_at);

insert into public.dashboard_memory_photos (memory_id, image_url, caption, sort_order)
select
  memories.id,
  memories.image_url,
  memories.title,
  0
from public.dashboard_memories as memories
left join public.dashboard_memory_photos as photos
  on photos.memory_id = memories.id
 and photos.image_url = memories.image_url
where photos.id is null;

alter table public.dashboard_memory_photos enable row level security;

drop policy if exists "Public read memory photos" on public.dashboard_memory_photos;
create policy "Public read memory photos"
  on public.dashboard_memory_photos
  for select
  using (true);

drop policy if exists "Public insert memory photos" on public.dashboard_memory_photos;
create policy "Public insert memory photos"
  on public.dashboard_memory_photos
  for insert
  with check (true);

drop policy if exists "Public update memories" on public.dashboard_memories;
create policy "Public update memories"
  on public.dashboard_memories
  for update
  using (true)
  with check (true);
