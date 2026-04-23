alter table public.dashboard_memories
  add column if not exists owner_id text;

update public.dashboard_memories
set owner_id = 'shared'
where owner_id is null;

alter table public.dashboard_memories
  alter column owner_id set default 'shared';

alter table public.dashboard_memories
  alter column owner_id set not null;

create index if not exists dashboard_memories_owner_created_at_idx
  on public.dashboard_memories (owner_id, created_at desc);

alter table public.dashboard_vibes
  add column if not exists owner_id text;

update public.dashboard_vibes
set owner_id = 'shared'
where owner_id is null;

alter table public.dashboard_vibes
  alter column owner_id set default 'shared';

alter table public.dashboard_vibes
  alter column owner_id set not null;

alter table public.dashboard_vibes
  drop constraint if exists dashboard_vibes_pkey;

alter table public.dashboard_vibes
  add constraint dashboard_vibes_pkey primary key (owner_id, day_key, person);

create index if not exists dashboard_vibes_owner_day_key_idx
  on public.dashboard_vibes (owner_id, day_key desc);
