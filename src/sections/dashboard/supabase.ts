import { supabase, isSupabaseReady } from 'src/lib/supabase';

import type { Vibe, DashboardVibes, DashboardMemory, DashboardPerson, DashboardMemoryDraft } from './types';

const MEMORIES_TABLE = 'dashboard_memories';
const VIBES_TABLE = 'dashboard_vibes';
const MEMORIES_BUCKET = 'dashboard-memories';

type DashboardMemoryRow = {
  id: string;
  memory_date: string;
  title: string | null;
  description: string | null;
  image_url: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
};

type DashboardVibeRow = {
  person: DashboardPerson;
  emoji: string;
  note: string | null;
};

function mapMemoryRow(row: DashboardMemoryRow): DashboardMemory {
  return {
    id: row.id,
    date: row.memory_date,
    title: row.title ?? undefined,
    description: row.description ?? undefined,
    imageSrc: row.image_url,
    location: {
      name: row.location_name,
      coordinates: [row.location_lat, row.location_lng],
      source: 'search',
    },
  };
}

function getUploadPath(file: File) {
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
  return `memories/${fileName}`;
}

async function uploadMemoryImage(file: File) {
  const filePath = getUploadPath(file);

  const { error } = await supabase.storage.from(MEMORIES_BUCKET).upload(filePath, file, {
    contentType: file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(MEMORIES_BUCKET).getPublicUrl(filePath);
  if (!data.publicUrl) throw new Error('Could not resolve uploaded image URL');

  return data.publicUrl;
}

export async function listDashboardMemories() {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase
    .from(MEMORIES_TABLE)
    .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load memories: ${error.message}`);

  return ((data ?? []) as DashboardMemoryRow[]).map(mapMemoryRow);
}

export async function createDashboardMemory(draft: DashboardMemoryDraft) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const imageUrl = await uploadMemoryImage(draft.imageFile);

  const { data, error } = await supabase
    .from(MEMORIES_TABLE)
    .insert({
      memory_date: draft.date,
      title: draft.title ?? null,
      description: draft.description ?? null,
      image_url: imageUrl,
      location_name: draft.location.name,
      location_lat: draft.location.coordinates[0],
      location_lng: draft.location.coordinates[1],
    })
    .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
    .single();

  if (error) throw new Error(`Could not save memory: ${error.message}`);

  return mapMemoryRow(data as DashboardMemoryRow);
}

export async function loadTodayVibes(dayKey: string, fallback: DashboardVibes) {
  if (!isSupabaseReady) return fallback;

  const { data, error } = await supabase
    .from(VIBES_TABLE)
    .select('person, emoji, note')
    .eq('day_key', dayKey);

  if (error) throw new Error(`Could not load today's vibes: ${error.message}`);

  const next: DashboardVibes = { ...fallback };

  for (const item of (data ?? []) as DashboardVibeRow[]) {
    if (item.person === 'marija' || item.person === 'aco') {
      next[item.person] = {
        emoji: item.emoji,
        text: item.note ?? '',
      };
    }
  }

  return next;
}

export async function saveTodayVibe(args: { dayKey: string; person: DashboardPerson; vibe: Vibe }) {
  if (!isSupabaseReady) return;

  const { dayKey, person, vibe } = args;

  const { error } = await supabase.from(VIBES_TABLE).upsert(
    {
      day_key: dayKey,
      person,
      emoji: vibe.emoji,
      note: vibe.text,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'day_key,person' }
  );

  if (error) throw new Error(`Could not save today's vibe: ${error.message}`);
}
