import { supabase, isSupabaseReady } from 'src/lib/supabase';

import { prepareImageForDisplayAndUpload } from './image-file';

import type {
  Vibe,
  DashboardMedia,
  DashboardVibes,
  DashboardMemory,
  DashboardPerson,
  DashboardMediaTarget,
  DashboardMemoryDraft,
} from './types';

const MEMORIES_TABLE = 'dashboard_memories';
const VIBES_TABLE = 'dashboard_vibes';
const MEMORIES_BUCKET = 'dashboard-memories';
const MEDIA_TABLE = 'dashboard_media_settings';
const MEDIA_BUCKET = 'dashboard-media';
const MEDIA_ROW_ID = 'main';

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

type DashboardMediaRow = {
  hero_image_url: string | null;
  marija_avatar_url: string | null;
  aco_avatar_url: string | null;
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

function getMediaPath(target: DashboardMediaTarget, file: File) {
  const fileExt = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}.${fileExt}`;
  return `${target}/${fileName}`;
}

function mapMediaRow(row?: DashboardMediaRow | null): DashboardMedia {
  if (!row) return {};

  return {
    heroImage: row.hero_image_url ?? undefined,
    marijaAvatar: row.marija_avatar_url ?? undefined,
    acoAvatar: row.aco_avatar_url ?? undefined,
  };
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

  const { file: preparedFile } = await prepareImageForDisplayAndUpload(draft.imageFile);
  const imageUrl = await uploadMemoryImage(preparedFile);

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

export async function loadDashboardMedia() {
  if (!isSupabaseReady) return {};

  const { data, error } = await supabase
    .from(MEDIA_TABLE)
    .select('hero_image_url, marija_avatar_url, aco_avatar_url')
    .eq('id', MEDIA_ROW_ID)
    .maybeSingle();

  if (error) throw new Error(`Could not load dashboard media: ${error.message}`);

  return mapMediaRow((data as DashboardMediaRow | null) ?? null);
}

export async function saveDashboardMedia(args: { media: DashboardMedia }) {
  if (!isSupabaseReady) return;

  const { media } = args;

  const { error } = await supabase.from(MEDIA_TABLE).upsert(
    {
      id: MEDIA_ROW_ID,
      hero_image_url: media.heroImage ?? null,
      marija_avatar_url: media.marijaAvatar ?? null,
      aco_avatar_url: media.acoAvatar ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' }
  );

  if (error) throw new Error(`Could not save dashboard media: ${error.message}`);
}

export async function uploadDashboardMediaImage(args: { file: File; target: DashboardMediaTarget }) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const { target, file } = args;
  const prepared = await prepareImageForDisplayAndUpload(file);
  const filePath = getMediaPath(target, prepared.file);

  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(filePath, prepared.file, {
    contentType: prepared.file.type,
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`Image upload failed: ${error.message}`);

  const { data } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(filePath);
  if (!data.publicUrl) throw new Error('Could not resolve uploaded image URL');

  return { url: data.publicUrl, warning: prepared.warning };
}
