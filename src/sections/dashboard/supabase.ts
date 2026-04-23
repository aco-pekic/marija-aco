import { supabase, isSupabaseReady } from 'src/lib/supabase';

import { prepareImageForDisplayAndUpload } from './image-file';

import type {
  Vibe,
  DashboardWish,
  DashboardMedia,
  DashboardVibes,
  DashboardMemory,
  DashboardPerson,
  DashboardMediaTarget,
  DashboardMemoryDraft,
  DashboardMemoryPhoto,
  DashboardMemoryDetails,
  DashboardMemoryUpdateInput,
  DashboardMemoryPhotoUpdateInput,
} from './types';

const MEMORIES_TABLE = 'dashboard_memories';
const MEMORY_PHOTOS_TABLE = 'dashboard_memory_photos';
const VIBES_TABLE = 'dashboard_vibes';
const WISHES_TABLE = 'dashboard_wishes';
const MEMORIES_BUCKET = 'dashboard-memories';
const MEDIA_TABLE = 'dashboard_media_settings';
const MEDIA_BUCKET = 'dashboard-media';
const MEDIA_ROW_ID = 'main';
const LEGACY_MEDIA_ROW_IDS = ['main', 'shared'] as const;

type DashboardMemoryRow = {
  id: string;
  memory_date: string;
  title: string | null;
  description: string | null;
  image_url: string;
  location_name: string;
  location_lat: number;
  location_lng: number;
  shared_note?: string | null;
  added_by?: DashboardPerson | null;
  updated_at?: string | null;
};

type DashboardMemoryPhotoRow = {
  id: string;
  memory_id: string;
  image_url: string;
  caption: string | null;
  sort_order: number;
  created_at: string;
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

type DashboardWishRow = {
  id: string;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  note: string | null;
};

type QueryError = {
  code?: string;
  message: string;
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
    addedBy: row.added_by ?? 'marija',
    sharedNote: row.shared_note ?? undefined,
    updatedAt: row.updated_at ?? undefined,
  };
}

function mapMemoryPhotoRow(row: DashboardMemoryPhotoRow): DashboardMemoryPhoto {
  return {
    id: row.id,
    imageSrc: row.image_url,
    caption: row.caption ?? undefined,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
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

function normalizePlaceName(name: string) {
  return name.split(',')[0]?.trim().toLowerCase() ?? '';
}

function mapMediaRow(row?: DashboardMediaRow | null): DashboardMedia {
  if (!row) return {};

  return {
    heroImage: row.hero_image_url ?? undefined,
    marijaAvatar: row.marija_avatar_url ?? undefined,
    acoAvatar: row.aco_avatar_url ?? undefined,
  };
}

function mapWishRow(row: DashboardWishRow): DashboardWish {
  return {
    id: row.id,
    location: {
      name: row.destination_name,
      coordinates: [row.destination_lat, row.destination_lng],
      source: 'search',
    },
    note: row.note ?? undefined,
  };
}

function isMissingOwnerColumnError(error: QueryError | null) {
  if (!error) return false;

  if (error.code === '42703') return true;

  const message = error.message.toLowerCase();
  return message.includes('owner_id') && message.includes('does not exist');
}

function isMissingMemoryEnhancementColumnError(error: QueryError | null) {
  if (!error) return false;

  if (error.code === '42703') return true;

  const message = error.message.toLowerCase();
  return (
    (message.includes('shared_note') || message.includes('added_by') || message.includes('updated_at')) &&
    message.includes('does not exist')
  );
}

function isMissingMemoryPhotosTableError(error: QueryError | null) {
  if (!error) return false;

  const message = error.message.toLowerCase();
  return (
    (error.code === '42p01' && message.includes(MEMORY_PHOTOS_TABLE)) ||
    (message.includes(MEMORY_PHOTOS_TABLE) &&
      (message.includes('does not exist') ||
        message.includes('could not find the table') ||
        message.includes('schema cache')))
  );
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

async function uploadMemoryImages(files: File[]) {
  const uploaded: string[] = [];

  for (const file of files) {
    const { file: preparedFile } = await prepareImageForDisplayAndUpload(file);
    uploaded.push(await uploadMemoryImage(preparedFile));
  }

  return uploaded;
}

async function fetchMemoryRows(ownerId: string) {
  const enhancedSelect =
    'id, memory_date, title, description, image_url, location_name, location_lat, location_lng, shared_note, added_by, updated_at';

  const enhanced = await supabase
    .from(MEMORIES_TABLE)
    .select(enhancedSelect)
    .eq('owner_id', ownerId)
    .order('memory_date', { ascending: false })
    .order('created_at', { ascending: false });

  if (isMissingOwnerColumnError(enhanced.error as QueryError | null)) {
    const legacy = await supabase
      .from(MEMORIES_TABLE)
      .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
      .order('memory_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (legacy.error) throw new Error(`Could not load memories: ${legacy.error.message}`);
    return (legacy.data ?? []) as DashboardMemoryRow[];
  }

  if (isMissingMemoryEnhancementColumnError(enhanced.error as QueryError | null)) {
    const fallback = await supabase
      .from(MEMORIES_TABLE)
      .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
      .eq('owner_id', ownerId)
      .order('memory_date', { ascending: false })
      .order('created_at', { ascending: false });

    if (fallback.error) throw new Error(`Could not load memories: ${fallback.error.message}`);
    return (fallback.data ?? []) as DashboardMemoryRow[];
  }

  if (enhanced.error) throw new Error(`Could not load memories: ${enhanced.error.message}`);
  return (enhanced.data ?? []) as DashboardMemoryRow[];
}

async function fetchMemoryPhotoRows(memoryId: string) {
  const result = await supabase
    .from(MEMORY_PHOTOS_TABLE)
    .select('id, memory_id, image_url, caption, sort_order, created_at')
    .eq('memory_id', memoryId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (isMissingMemoryPhotosTableError(result.error as QueryError | null)) {
    return null;
  }

  if (result.error) throw new Error(`Could not load memory photos: ${result.error.message}`);
  return (result.data ?? []) as DashboardMemoryPhotoRow[];
}

export async function listDashboardMemories(ownerId = 'shared') {
  if (!isSupabaseReady) return [];

  const rows = await fetchMemoryRows(ownerId);
  return rows.map(mapMemoryRow);
}

export async function createDashboardMemory(draft: DashboardMemoryDraft, ownerId = 'shared') {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const { file: preparedFile } = await prepareImageForDisplayAndUpload(draft.imageFile);
  const imageUrl = await uploadMemoryImage(preparedFile);

  const payload = {
    owner_id: ownerId,
    memory_date: draft.date,
    title: draft.title ?? null,
    description: draft.description ?? null,
    image_url: imageUrl,
    location_name: draft.location.name,
    location_lat: draft.location.coordinates[0],
    location_lng: draft.location.coordinates[1],
    shared_note: null,
    added_by: draft.addedBy ?? 'marija',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(MEMORIES_TABLE)
    .insert(payload)
    .select(
      'id, memory_date, title, description, image_url, location_name, location_lat, location_lng, shared_note, added_by, updated_at'
    )
    .single();

  if (isMissingOwnerColumnError(error as QueryError | null)) {
    const {
      owner_id: _ignoredOwnerId,
      shared_note: _ignoredSharedNote,
      added_by: _ignoredAddedBy,
      updated_at: _ignoredUpdatedAt,
      ...legacyPayload
    } = payload;
    void _ignoredOwnerId;
    void _ignoredSharedNote;
    void _ignoredAddedBy;
    void _ignoredUpdatedAt;

    const legacy = await supabase
      .from(MEMORIES_TABLE)
      .insert(legacyPayload)
      .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
      .single();

    if (legacy.error) throw new Error(`Could not save memory: ${legacy.error.message}`);

    return mapMemoryRow(legacy.data as DashboardMemoryRow);
  }

  if (isMissingMemoryEnhancementColumnError(error as QueryError | null)) {
    const {
      shared_note: _ignoredSharedNote,
      added_by: _ignoredAddedBy,
      updated_at: _ignoredUpdatedAt,
      ...fallbackPayload
    } = payload;
    void _ignoredSharedNote;
    void _ignoredAddedBy;
    void _ignoredUpdatedAt;

    const fallback = await supabase
      .from(MEMORIES_TABLE)
      .insert(fallbackPayload)
      .select('id, memory_date, title, description, image_url, location_name, location_lat, location_lng')
      .single();

    if (fallback.error) throw new Error(`Could not save memory: ${fallback.error.message}`);

    return mapMemoryRow(fallback.data as DashboardMemoryRow);
  }

  if (error) throw new Error(`Could not save memory: ${error.message}`);

  const inserted = mapMemoryRow(data as DashboardMemoryRow);

  const photoInsert = await supabase.from(MEMORY_PHOTOS_TABLE).insert({
    memory_id: inserted.id,
    image_url: inserted.imageSrc,
    caption: draft.title ?? null,
    sort_order: 0,
  });

  if (photoInsert.error && !isMissingMemoryPhotosTableError(photoInsert.error as QueryError | null)) {
    throw new Error(`Could not save memory photo: ${photoInsert.error.message}`);
  }

  return inserted;
}

export async function getDashboardMemoryDetails(memoryId: string, ownerId = 'shared') {
  if (!isSupabaseReady) return null;

  const memories = await fetchMemoryRows(ownerId);
  const summaryItems = memories.map(mapMemoryRow);
  const currentIndex = summaryItems.findIndex((memory) => memory.id === memoryId);

  if (currentIndex < 0) return null;

  const currentMemory = summaryItems[currentIndex];
  const photoRows = await fetchMemoryPhotoRows(memoryId);
  const photos =
    photoRows?.length
      ? photoRows.map(mapMemoryPhotoRow)
      : [
          {
            id: `legacy-${currentMemory.id}`,
            imageSrc: currentMemory.imageSrc,
            sortOrder: 0,
          },
        ];

  const relatedMemories = summaryItems
    .filter((memory) => memory.id !== memoryId)
    .filter(
      (memory) =>
        normalizePlaceName(memory.location.name) === normalizePlaceName(currentMemory.location.name)
    )
    .slice(0, 6);

  return {
    ...currentMemory,
    photos,
    photoCount: photos.length,
    previousMemory: summaryItems[currentIndex + 1] ?? null,
    nextMemory: summaryItems[currentIndex - 1] ?? null,
    relatedMemories,
  } satisfies DashboardMemoryDetails;
}

export async function addDashboardMemoryPhotos(args: {
  memoryId: string;
  files: File[];
  ownerId?: string;
}) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const { memoryId, files, ownerId = 'shared' } = args;
  if (!files.length) return [];

  const existing = await getDashboardMemoryDetails(memoryId, ownerId);
  if (!existing) throw new Error('Memory not found.');

  const uploadedUrls = await uploadMemoryImages(files);
  const payload = uploadedUrls.map((url, index) => ({
    memory_id: memoryId,
    image_url: url,
    caption: null,
    sort_order: existing.photos.length + index,
  }));

  const result = await supabase
    .from(MEMORY_PHOTOS_TABLE)
    .insert(payload)
    .select('id, memory_id, image_url, caption, sort_order, created_at');

  if (isMissingMemoryPhotosTableError(result.error as QueryError | null)) {
    throw new Error('Memory galleries are not enabled in Supabase yet. Run "npx supabase db push".');
  }

  if (result.error) throw new Error(`Could not add photos: ${result.error.message}`);

  return ((result.data ?? []) as DashboardMemoryPhotoRow[]).map(mapMemoryPhotoRow);
}

export async function updateDashboardMemoryPhotos(args: {
  memoryId: string;
  photos: DashboardMemoryPhotoUpdateInput[];
}) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const { memoryId, photos } = args;
  if (!photos.length) return;

  const operations = photos.map((photo) =>
    supabase
      .from(MEMORY_PHOTOS_TABLE)
      .update({
        caption: photo.caption?.trim() || null,
        sort_order: photo.sortOrder,
      })
      .eq('memory_id', memoryId)
      .eq('id', photo.id)
  );

  const results = await Promise.all(operations);
  const failed = results.find(
    (result) =>
      !!result.error && !isMissingMemoryPhotosTableError(result.error as QueryError | null)
  );

  if (failed?.error) {
    throw new Error(`Could not update memory photos: ${failed.error.message}`);
  }

  const missingPhotosTable = results.find((result) =>
    isMissingMemoryPhotosTableError(result.error as QueryError | null)
  );

  if (missingPhotosTable) {
    throw new Error('Memory galleries are not enabled in Supabase yet. Run "npx supabase db push".');
  }
}

export async function updateDashboardMemoryDetails(
  memoryId: string,
  patch: DashboardMemoryUpdateInput,
  ownerId = 'shared'
) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const payload: Record<string, string | null> = { updated_at: new Date().toISOString() };

  if (patch.title !== undefined) payload.title = patch.title.trim() || null;
  if (patch.description !== undefined) payload.description = patch.description.trim() || null;
  if (patch.date !== undefined) payload.memory_date = patch.date;
  if (patch.sharedNote !== undefined) payload.shared_note = patch.sharedNote.trim() || null;
  if (patch.coverImageSrc !== undefined) payload.image_url = patch.coverImageSrc;

  const result = await supabase
    .from(MEMORIES_TABLE)
    .update(payload)
    .eq('owner_id', ownerId)
    .eq('id', memoryId)
    .select(
      'id, memory_date, title, description, image_url, location_name, location_lat, location_lng, shared_note, added_by, updated_at'
    )
    .single();

  if (isMissingOwnerColumnError(result.error as QueryError | null)) {
    throw new Error('Database is missing owner separation for memories. Run "npx supabase db push".');
  }

  if (isMissingMemoryEnhancementColumnError(result.error as QueryError | null)) {
    throw new Error('Memory details are not enabled in Supabase yet. Run "npx supabase db push".');
  }

  if (result.error) throw new Error(`Could not update memory: ${result.error.message}`);

  return mapMemoryRow(result.data as DashboardMemoryRow);
}

export async function loadTodayVibes(dayKey: string, fallback: DashboardVibes, ownerId: string) {
  if (!isSupabaseReady) return fallback;

  const mapRows = (rows: DashboardVibeRow[]) => {
    const next: DashboardVibes = { ...fallback };

    for (const item of rows) {
      if (item.person === 'marija' || item.person === 'aco') {
        next[item.person] = {
          emoji: item.emoji,
          text: item.note ?? '',
        };
      }
    }

    return next;
  };

  const accountResult = await supabase
    .from(VIBES_TABLE)
    .select('person, emoji, note')
    .eq('owner_id', ownerId)
    .eq('day_key', dayKey);

  if (isMissingOwnerColumnError(accountResult.error as QueryError | null)) {
    throw new Error('Database is missing owner separation for vibes. Run "npx supabase db push".');
  }

  if (accountResult.error) throw new Error(`Could not load today's vibes: ${accountResult.error.message}`);
  const accountRows = (accountResult.data ?? []) as DashboardVibeRow[];
  return mapRows(accountRows);
}

export async function saveTodayVibe(args: {
  dayKey: string;
  person: DashboardPerson;
  vibe: Vibe;
  ownerId: string;
}) {
  if (!isSupabaseReady) return;

  const { dayKey, person, vibe, ownerId } = args;

  const note = vibe.text.trim() ? vibe.text : '';

  const upsertPayload = {
    owner_id: ownerId,
    day_key: dayKey,
    person,
    emoji: vibe.emoji,
    note,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from(VIBES_TABLE)
    .upsert(upsertPayload, { onConflict: 'owner_id,day_key,person' });

  if (isMissingOwnerColumnError(error as QueryError | null)) {
    throw new Error('Database is missing owner separation for vibes. Run "npx supabase db push".');
  }

  if (error) throw new Error(`Could not save today's vibe: ${error.message}`);
}

export async function loadDashboardMedia() {
  if (!isSupabaseReady) return {};

  const fetchById = async (id: string) =>
    supabase
      .from(MEDIA_TABLE)
      .select('hero_image_url, marija_avatar_url, aco_avatar_url')
      .eq('id', id)
      .maybeSingle();

  const ownResult = await fetchById(MEDIA_ROW_ID);
  if (ownResult.error) throw new Error(`Could not load dashboard media: ${ownResult.error.message}`);
  if (ownResult.data) return mapMediaRow(ownResult.data as DashboardMediaRow);

  for (const legacyId of LEGACY_MEDIA_ROW_IDS) {
    if (legacyId === MEDIA_ROW_ID) continue;
    const legacyResult = await fetchById(legacyId);
    if (legacyResult.error) throw new Error(`Could not load dashboard media: ${legacyResult.error.message}`);
    if (legacyResult.data) return mapMediaRow(legacyResult.data as DashboardMediaRow);
  }

  const latestResult = await supabase
    .from(MEDIA_TABLE)
    .select('hero_image_url, marija_avatar_url, aco_avatar_url')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestResult.error) throw new Error(`Could not load dashboard media: ${latestResult.error.message}`);

  return mapMediaRow((latestResult.data as DashboardMediaRow | null) ?? null);
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

export async function listDashboardWishes(ownerId = 'shared') {
  if (!isSupabaseReady) return [];

  const { data, error } = await supabase
    .from(WISHES_TABLE)
    .select('id, destination_name, destination_lat, destination_lng, note')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Could not load wishes: ${error.message}`);

  return ((data ?? []) as DashboardWishRow[]).map(mapWishRow);
}

export async function createDashboardWish(args: {
  ownerId: string;
  destination: { name: string; coordinates: [number, number] };
  note?: string;
}) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const payload = {
    owner_id: args.ownerId,
    destination_name: args.destination.name,
    destination_lat: args.destination.coordinates[0],
    destination_lng: args.destination.coordinates[1],
    note: args.note?.trim() ? args.note.trim() : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(WISHES_TABLE)
    .insert(payload)
    .select('id, destination_name, destination_lat, destination_lng, note')
    .single();

  if (error) throw new Error(`Could not save wish: ${error.message}`);

  return mapWishRow(data as DashboardWishRow);
}

export async function updateDashboardWish(args: {
  ownerId: string;
  id: string;
  destination: { name: string; coordinates: [number, number] };
  note?: string;
}) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const payload = {
    destination_name: args.destination.name,
    destination_lat: args.destination.coordinates[0],
    destination_lng: args.destination.coordinates[1],
    note: args.note?.trim() ? args.note.trim() : null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from(WISHES_TABLE)
    .update(payload)
    .eq('owner_id', args.ownerId)
    .eq('id', args.id)
    .select('id, destination_name, destination_lat, destination_lng, note')
    .single();

  if (error) throw new Error(`Could not update wish: ${error.message}`);

  return mapWishRow(data as DashboardWishRow);
}

export async function deleteDashboardWish(args: { ownerId: string; id: string }) {
  if (!isSupabaseReady) throw new Error('Supabase is not configured');

  const { error } = await supabase
    .from(WISHES_TABLE)
    .delete()
    .eq('owner_id', args.ownerId)
    .eq('id', args.id);

  if (error) throw new Error(`Could not delete wish: ${error.message}`);
}
