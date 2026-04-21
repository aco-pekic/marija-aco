import dayjs from 'dayjs';
import { useLocalStorage } from 'minimal-shared/hooks';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { varAlpha, getStorage as getStorageValue } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';

import { useRouter } from 'src/routes/hooks';

import { isSupabaseReady } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { DASHBOARD_PLACES } from './data';
import { DashboardHero } from './components/dashboard-hero';
import { DashboardVibes } from './components/dashboard-vibes';
import { prepareImageForDisplayAndUpload } from './image-file';
import { TodayVibeDialog } from './components/today-vibe-dialog';
import { AddMemoryDialog } from './components/add-memory-dialog';
import { DashboardStoryCard } from './components/dashboard-story-card';
import { DashboardMapDialog } from './components/dashboard-map-dialog';
import { DashboardBottomNav } from './components/dashboard-bottom-nav';
import { DashboardUserMemories } from './components/dashboard-user-memories';
import { DashboardQuickMemories } from './components/dashboard-quick-memories';
import { DashboardLoveGlobeSection } from './components/dashboard-love-globe-section';
import { DashboardMediaViewerDialog } from './components/dashboard-media-viewer-dialog';
import { DashboardPlaceGalleryDialog } from './components/dashboard-place-gallery-dialog';
import {
  saveTodayVibe,
  loadTodayVibes,
  saveDashboardMedia,
  loadDashboardMedia,
  createDashboardMemory,
  listDashboardMemories,
  uploadDashboardMediaImage,
} from './supabase';

import type {
  Vibe,
  GlobePlace,
  DashboardMedia,
  DashboardPerson,
  DashboardMemory,
  DashboardMediaTarget,
  DashboardVibesStorage,
} from './types';

const VIBES_STORAGE_KEY = 'dashboard:vibes:v1';
const MEDIA_STORAGE_KEY = 'dashboard:media:v1';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

function toPlaceId(name: string, coordinates: [number, number]) {
  const slug =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || 'place';

  return `memory-${slug}-${coordinates[0].toFixed(4)}-${coordinates[1].toFixed(4)}`;
}

function getMediaTargetMeta(target: DashboardMediaTarget) {
  if (target === 'hero') {
    return {
      title: 'Hero Image',
      subtitle: 'Your dashboard cover photo',
      key: 'heroImage' as const,
    };
  }

  if (target === 'marija') {
    return {
      title: 'Marija Avatar',
      subtitle: 'Tap and hold to inspect details, then edit below',
      key: 'marijaAvatar' as const,
    };
  }

  return {
    title: 'Aco Avatar',
    subtitle: 'Tap and hold to inspect details, then edit below',
    key: 'acoAvatar' as const,
  };
}

export function DashboardView() {
  const router = useRouter();
  const { authenticated } = useAuthContext();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GlobePlace | null>(null);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isTodayVibeOpen, setIsTodayVibeOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<DashboardMediaTarget | null>(null);

  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryLoadError, setMemoryLoadError] = useState<string | null>(null);
  const [memorySubmitError, setMemorySubmitError] = useState<string | null>(null);

  const [isSavingVibes, setIsSavingVibes] = useState(false);
  const [vibeSaveError, setVibeSaveError] = useState<string | null>(null);
  const [didHydrateRemoteVibes, setDidHydrateRemoteVibes] = useState(!isSupabaseReady);

  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const defaultVibes = useMemo(
    () => ({ marija: { emoji: '✨', text: '' }, aco: { emoji: '💙', text: '' } }),
    []
  );

  const { state: vibesStorage, setState: setVibesStorage } = useLocalStorage<DashboardVibesStorage>(
    VIBES_STORAGE_KEY,
    { dayKey: todayKey, vibes: defaultVibes }
  );

  const { state: mediaStorage, setState: setMediaStorage } = useLocalStorage<DashboardMedia>(
    MEDIA_STORAGE_KEY,
    {}
  );

  const vibesStorageRef = useRef(vibesStorage);
  const mediaStorageRef = useRef(mediaStorage);

  useEffect(() => {
    vibesStorageRef.current = vibesStorage;
  }, [vibesStorage]);

  useEffect(() => {
    mediaStorageRef.current = mediaStorage;
  }, [mediaStorage]);

  const resetAt = useMemo(
    () => dayjs(`${todayKey}T00:00:00`).add(1, 'day').startOf('day').toDate(),
    [todayKey]
  );

  useEffect(() => {
    if (vibesStorage.dayKey === todayKey) return;

    setVibesStorage({
      dayKey: todayKey,
      vibes: defaultVibes,
      lastExpired: { dayKey: vibesStorage.dayKey, vibes: vibesStorage.vibes },
    });
  }, [defaultVibes, setVibesStorage, todayKey, vibesStorage.dayKey, vibesStorage.vibes]);

  useEffect(() => {
    const msUntilReset = resetAt.getTime() - Date.now();

    const timeoutId = window.setTimeout(
      () => {
        const currentTodayKey = dayjs().format('YYYY-MM-DD');
        const stored = getStorageValue<DashboardVibesStorage>(VIBES_STORAGE_KEY);
        const current = stored ?? vibesStorageRef.current;

        if (current?.dayKey === currentTodayKey) return;

        setVibesStorage({
          dayKey: currentTodayKey,
          vibes: defaultVibes,
          ...(current && { lastExpired: { dayKey: current.dayKey, vibes: current.vibes } }),
        });
      },
      Math.max(msUntilReset + 250, 0)
    );

    return () => window.clearTimeout(timeoutId);
  }, [defaultVibes, resetAt, setVibesStorage]);

  const marijaVibe = vibesStorage.vibes.marija;
  const acoVibe = vibesStorage.vibes.aco;

  const updateVibe = useCallback(
    (person: DashboardPerson, next: Vibe) => {
      const current = vibesStorageRef.current;
      setVibesStorage({ ...current, vibes: { ...current.vibes, [person]: next } });
    },
    [setVibesStorage]
  );

  const memoryObjectUrlsRef = useRef<string[]>([]);
  const mediaObjectUrlsRef = useRef<string[]>([]);
  const [memories, setMemories] = useState<DashboardMemory[]>([]);

  const memoryDrivenPlaces = useMemo<GlobePlace[]>(() => {
    const groupedPlaces = new Map<string, GlobePlace>();

    for (const memory of memories) {
      const [lat, lng] = memory.location.coordinates;
      const groupKey = `${memory.location.name}|${lat.toFixed(6)}|${lng.toFixed(6)}`;
      const existing = groupedPlaces.get(groupKey);
      const memoryCard = {
        src: memory.imageSrc,
        label: memory.title ?? memory.description ?? memory.location.name,
        date: memory.date,
      };

      if (existing) {
        existing.memories.push(memoryCard);
        continue;
      }

      groupedPlaces.set(groupKey, {
        id: toPlaceId(memory.location.name, memory.location.coordinates),
        name: memory.location.name,
        status: 'visited',
        coordinates: memory.location.coordinates,
        memories: [memoryCard],
      });
    }

    return Array.from(groupedPlaces.values()).map((place) => ({
      ...place,
      memories: [...place.memories].sort((a, b) => b.date.localeCompare(a.date)),
    }));
  }, [memories]);

  const wishlistPlaces = useMemo(
    () => DASHBOARD_PLACES.filter((place) => place.status === 'wishlist'),
    []
  );

  const globePlaces = useMemo(
    () => [...memoryDrivenPlaces, ...wishlistPlaces],
    [memoryDrivenPlaces, wishlistPlaces]
  );

  useEffect(
    () => () => {
      memoryObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      memoryObjectUrlsRef.current = [];
      mediaObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      mediaObjectUrlsRef.current = [];
    },
    []
  );

  useEffect(() => {
    if (!isSupabaseReady) return undefined;

    let active = true;

    (async () => {
      try {
        const fetched = await listDashboardMemories();
        if (!active) return;

        setMemories(fetched);
        setMemoryLoadError(null);
      } catch (error) {
        if (!active) return;
        setMemoryLoadError(getErrorMessage(error));
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isSupabaseReady) return undefined;

    let active = true;

    (async () => {
      try {
        const remoteMedia = await loadDashboardMedia();
        if (!active) return;
        setMediaStorage({ ...mediaStorageRef.current, ...remoteMedia });
      } catch (error) {
        if (!active) return;
        setMediaError(getErrorMessage(error));
      }
    })();

    return () => {
      active = false;
    };
  }, [setMediaStorage]);

  useEffect(() => {
    if (!isSupabaseReady) return undefined;

    let active = true;
    setDidHydrateRemoteVibes(false);

    (async () => {
      try {
        const remoteVibes = await loadTodayVibes(todayKey, defaultVibes);
        if (!active) return;

        const current = vibesStorageRef.current;
        setVibesStorage({ ...current, dayKey: todayKey, vibes: remoteVibes });
        setVibeSaveError(null);
      } catch (error) {
        if (!active) return;
        setVibeSaveError(getErrorMessage(error));
      } finally {
        if (active) setDidHydrateRemoteVibes(true);
      }
    })();

    return () => {
      active = false;
    };
  }, [defaultVibes, setVibesStorage, todayKey]);

  useEffect(() => {
    if (!isSupabaseReady || !didHydrateRemoteVibes) return undefined;

    const timeoutId = window.setTimeout(async () => {
      setIsSavingVibes(true);
      setVibeSaveError(null);

      try {
        await Promise.all([
          saveTodayVibe({ dayKey: todayKey, person: 'marija', vibe: marijaVibe }),
          saveTodayVibe({ dayKey: todayKey, person: 'aco', vibe: acoVibe }),
        ]);
      } catch (error) {
        setVibeSaveError(getErrorMessage(error));
      } finally {
        setIsSavingVibes(false);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [
    acoVibe,
    didHydrateRemoteVibes,
    marijaVibe,
    todayKey,
  ]);

  const heroImage = mediaStorage.heroImage;
  const marijaAvatar = mediaStorage.marijaAvatar;
  const acoAvatar = mediaStorage.acoAvatar;

  const activeMediaMeta = useMemo(
    () => (activeMediaTarget ? getMediaTargetMeta(activeMediaTarget) : null),
    [activeMediaTarget]
  );

  const activeMediaSrc = useMemo(() => {
    if (!activeMediaMeta) return undefined;

    if (activeMediaMeta.key === 'heroImage') {
      return heroImage ?? '/assets/background/background-4.jpg';
    }

    return mediaStorage[activeMediaMeta.key];
  }, [activeMediaMeta, heroImage, mediaStorage]);

  const openMediaTarget = useCallback((target: DashboardMediaTarget) => {
    setMediaError(null);
    setMediaWarning(null);
    setActiveMediaTarget(target);
  }, []);

  const handleChangeMedia = useCallback(
    async (file: File) => {
      if (!activeMediaTarget || isSavingMedia) return;

      setIsSavingMedia(true);
      setMediaError(null);
      setMediaWarning(null);

      const key = getMediaTargetMeta(activeMediaTarget).key;

      try {
        if (isSupabaseReady) {
          const uploaded = await uploadDashboardMediaImage({ file, target: activeMediaTarget });
          const nextMedia = { ...mediaStorageRef.current, [key]: uploaded.url };

          await saveDashboardMedia({ media: nextMedia });
          setMediaStorage(nextMedia);
          setMediaWarning(uploaded.warning ?? null);
        } else {
          const prepared = await prepareImageForDisplayAndUpload(file);
          const localUrl = URL.createObjectURL(prepared.file);

          mediaObjectUrlsRef.current.push(localUrl);
          setMediaStorage({ ...mediaStorageRef.current, [key]: localUrl });
          setMediaWarning(prepared.warning ?? null);
        }
      } catch (error) {
        setMediaError(getErrorMessage(error));
      } finally {
        setIsSavingMedia(false);
      }
    },
    [activeMediaTarget, isSavingMedia, setMediaStorage]
  );

  return (
    <DashboardContent maxWidth="xl" disablePadding sx={{ pb: { xs: 14, md: 4 } }}>
      <Box
        sx={(theme) => ({
          position: 'relative',
          mx: { xs: 0, sm: 2 },
          mt: { xs: 0, sm: 2 },
          bgcolor: theme.vars.palette.background.default,
        })}
      >
        <DashboardHero
          backgroundImage={heroImage}
          marijaAvatarSrc={marijaAvatar}
          acoAvatarSrc={acoAvatar}
          onOpenHero={() => openMediaTarget('hero')}
          onOpenAvatar={(person) => openMediaTarget(person)}
        />
        <DashboardStoryCard />

        <Card
          sx={(theme) => ({
            position: 'relative',
            zIndex: 1,
            mt: -10,
            borderRadius: { xs: 0, sm: 3 },
            border: {
              xs: 'none',
              sm: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
            },
            bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.88),
            backdropFilter: 'blur(14px)',
            boxShadow: `0 26px 68px -30px ${varAlpha(theme.vars.palette.common.blackChannel, 0.8)}`,
          })}
        >
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              pt: { xs: 15, md: 9 },
              pb: { xs: 3, md: 4 },
            }}
          >
            <DashboardVibes
              authenticated={authenticated}
              resetAt={resetAt}
              marija={marijaVibe}
              aco={acoVibe}
              onOpenNote={() => setIsTodayVibeOpen(true)}
              onChangeMarija={(next) => updateVibe('marija', next)}
              onChangeAco={(next) => updateVibe('aco', next)}
            />

            {memoryLoadError ? (
              <Typography
                variant="caption"
                sx={(theme) => ({ display: 'block', mb: 1.25, color: theme.vars.palette.error.main })}
              >
                {memoryLoadError}
              </Typography>
            ) : null}

            <DashboardUserMemories memories={memories} />

            <DashboardLoveGlobeSection
              places={globePlaces}
              onOpenMap={() => setIsMapOpen(true)}
              onOpenPlace={(placeId) =>
                setSelectedPlace(globePlaces.find((place) => place.id === placeId) ?? null)
              }
            />

            <DashboardQuickMemories places={memoryDrivenPlaces} />

            <Box sx={{ height: { xs: 16, md: 24 } }} />
          </Box>
        </Card>
      </Box>

      <DashboardMapDialog
        open={isMapOpen}
        places={globePlaces}
        onClose={() => setIsMapOpen(false)}
        onSelectPlace={(place) => setSelectedPlace(place)}
      />

      <DashboardPlaceGalleryDialog place={selectedPlace} onClose={() => setSelectedPlace(null)} />

      <AddMemoryDialog
        open={isAddMemoryOpen}
        onClose={() => {
          if (isSavingMemory) return;
          setMemorySubmitError(null);
          setIsAddMemoryOpen(false);
        }}
        submitting={isSavingMemory}
        submitError={memorySubmitError}
        onSubmit={async (draft) => {
          setMemorySubmitError(null);
          setIsSavingMemory(true);

          try {
            if (isSupabaseReady) {
              const savedMemory = await createDashboardMemory(draft);
              setMemories((prev) => [savedMemory, ...prev]);
            } else {
              const imageSrc = URL.createObjectURL(draft.imageFile);
              memoryObjectUrlsRef.current.push(imageSrc);

              setMemories((prev) => [
                {
                  id:
                    typeof crypto !== 'undefined' && 'randomUUID' in crypto
                      ? crypto.randomUUID()
                      : String(Date.now()),
                  date: draft.date,
                  imageSrc,
                  location: draft.location,
                  title: draft.title,
                  description: draft.description,
                },
                ...prev,
              ]);
            }

            setIsAddMemoryOpen(false);
          } catch (error) {
            setMemorySubmitError(getErrorMessage(error));
          } finally {
            setIsSavingMemory(false);
          }
        }}
      />

      <DashboardMediaViewerDialog
        open={!!activeMediaTarget && !!activeMediaMeta}
        title={activeMediaMeta?.title ?? ''}
        subtitle={activeMediaMeta?.subtitle ?? ''}
        imageSrc={activeMediaSrc}
        onClose={() => setActiveMediaTarget(null)}
        onChangeImage={handleChangeMedia}
        isSaving={isSavingMedia}
        error={mediaError}
        warning={mediaWarning}
      />

      <TodayVibeDialog
        open={isTodayVibeOpen}
        marija={marijaVibe}
        aco={acoVibe}
        onClose={() => setIsTodayVibeOpen(false)}
        onChangeMarija={(next) => updateVibe('marija', next)}
        onChangeAco={(next) => updateVibe('aco', next)}
        isSaving={isSavingVibes}
        saveError={vibeSaveError}
      />

      <DashboardBottomNav
        onHome={() => router.push('/dashboard')}
        onAdd={() => setIsAddMemoryOpen(true)}
        onAddNote={() => setIsTodayVibeOpen(true)}
      />
    </DashboardContent>
  );
}
