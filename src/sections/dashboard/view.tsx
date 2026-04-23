import { useLocalStorage } from 'minimal-shared/hooks';
import { useSearchParams as _useSearchParams } from 'react-router';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';
import { varAlpha, getStorage as getStorageValue } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { isSupabaseReady } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { useAuthContext } from 'src/auth/hooks';

import { getDashboardDayKey } from './day-key';
import { DASHBOARD_MEDIA_STORAGE_KEY } from './constants';
import { DashboardHero } from './components/dashboard-hero';
import { DashboardVibes } from './components/dashboard-vibes';
import { prepareImageForDisplayAndUpload } from './image-file';
import { AddMemoryDialog } from './components/add-memory-dialog';
import { TodayVibeDialog } from './components/today-vibe-dialog';
import { DashboardStoryCard } from './components/dashboard-story-card';
import { DashboardWishDialog } from './components/dashboard-wish-dialog';
import { DashboardUserMemories } from './components/dashboard-user-memories';
import { DashboardLoveGlobeSection } from './components/dashboard-love-globe-section';
import { DashboardMediaViewerDialog } from './components/dashboard-media-viewer-dialog';
import { DashboardPlaceGalleryDialog } from './components/dashboard-place-gallery-dialog';
import {
  saveTodayVibe,
  loadTodayVibes,
  loadDashboardMedia,
  saveDashboardMedia,
  createDashboardWish,
  deleteDashboardWish,
  listDashboardWishes,
  updateDashboardWish,
  createDashboardMemory,
  listDashboardMemories,
  uploadDashboardMediaImage,
} from './supabase';

import type {
  Vibe,
  GlobePlace,
  DashboardWish,
  DashboardMedia,
  DashboardMemory,
  DashboardPerson,
  DashboardLocation,
  DashboardMediaTarget,
  DashboardVibesStorage,
} from './types';

const VIBES_STORAGE_KEY_SUFFIX = 'vibes:v1';
const LEGACY_VIBES_STORAGE_KEY = 'dashboard:vibes:v1';
const WISHES_STORAGE_KEY_SUFFIX = 'wishes:v1';

const WISH_PLACE_PREFIX = 'wish-';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Nešto je pošlo po zlu. Pokušajte ponovo.';
}

function isMissingWishesTableError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : JSON.stringify(error);

  const normalized = message.toLowerCase();

  return (
    normalized.includes('dashboard_wishes') &&
    (normalized.includes('schema cache') ||
      normalized.includes('could not find the table') ||
      normalized.includes('pgrst205'))
  );
}

function getPrimaryPlaceName(name: string) {
  return name.split(',')[0]?.trim().toLowerCase() ?? '';
}

function haversineDistanceKm(a: [number, number], b: [number, number]) {
  const [lat1, lon1] = a;
  const [lat2, lon2] = b;
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const sLat1 = toRad(lat1);
  const sLat2 = toRad(lat2);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(sLat1) * Math.cos(sLat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * R * Math.asin(Math.sqrt(h));
}

const WISH_GRANT_DISTANCE_KM = 25;

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
      title: 'Naslovna slika',
      subtitle: 'Naslovna fotografija za tvoj dashboard',
      key: 'heroImage' as const,
    };
  }

  if (target === 'marija') {
    return {
      title: 'Marijin avatar',
      subtitle: 'Dodirni i drži za uvećanje, pa zatim izmeni ispod',
      key: 'marijaAvatar' as const,
    };
  }

  return {
    title: 'Acov avatar',
    subtitle: 'Dodirni i drži za uvećanje, pa zatim izmeni ispod',
    key: 'acoAvatar' as const,
  };
}

export function DashboardView() {
  const router = useRouter();
  const [searchParams, setSearchParams] = _useSearchParams();
  const { authenticated, user } = useAuthContext();

  const accountId = useMemo(
    () =>
      String(user?.accountId ?? user?.id ?? 'shared')
        .trim()
        .toLowerCase(),
    [user?.accountId, user?.id]
  );
  const vibesStorageKey = useMemo(
    () => `dashboard:${accountId}:${VIBES_STORAGE_KEY_SUFFIX}`,
    [accountId]
  );
  const wishesStorageKey = useMemo(
    () => `dashboard:${accountId}:${WISHES_STORAGE_KEY_SUFFIX}`,
    [accountId]
  );
  const currentPerson = useMemo<DashboardPerson>(
    () => (accountId === 'aco' ? 'aco' : 'marija'),
    [accountId]
  );

  const [selectedPlace, setSelectedPlace] = useState<GlobePlace | null>(null);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isTodayVibeOpen, setIsTodayVibeOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<DashboardMediaTarget | null>(null);

  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryLoadError, setMemoryLoadError] = useState<string | null>(null);
  const [memorySubmitError, setMemorySubmitError] = useState<string | null>(null);

  const [isWishDialogOpen, setIsWishDialogOpen] = useState(false);
  const [editingWishId, setEditingWishId] = useState<string | null>(null);
  const [wishLoadError, setWishLoadError] = useState<string | null>(null);
  const [wishSubmitError, setWishSubmitError] = useState<string | null>(null);
  const [isSavingWish, setIsSavingWish] = useState(false);
  const [isWishGrantedOpen, setIsWishGrantedOpen] = useState(false);
  const [grantedWish, setGrantedWish] = useState<DashboardWish | null>(null);

  const [isSavingVibes, setIsSavingVibes] = useState(false);
  const [vibeSaveError, setVibeSaveError] = useState<string | null>(null);
  const [didHydrateRemoteVibes, setDidHydrateRemoteVibes] = useState(!isSupabaseReady);

  const [isSavingMedia, setIsSavingMedia] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaWarning, setMediaWarning] = useState<string | null>(null);

  const [todayKey, setTodayKey] = useState(() => getDashboardDayKey());
  const dialogParam = searchParams.get('dialog');
  const defaultVibes = useMemo(
    () => ({ marija: { emoji: '✨', text: '' }, aco: { emoji: '💙', text: '' } }),
    []
  );

  const clearDialogParam = useCallback(
    (dialogName: 'add-memory' | 'today-vibe') => {
      if (dialogParam !== dialogName) return;

      const nextSearchParams = new URLSearchParams(searchParams);
      nextSearchParams.delete('dialog');
      setSearchParams(nextSearchParams, { replace: true });
    },
    [dialogParam, searchParams, setSearchParams]
  );

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setTodayKey((prev) => {
        const next = getDashboardDayKey();
        return prev === next ? prev : next;
      });
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (dialogParam === 'add-memory') setIsAddMemoryOpen(true);
    if (dialogParam === 'today-vibe') setIsTodayVibeOpen(true);
  }, [dialogParam]);

  const { state: vibesStorage, setState: setVibesStorage } = useLocalStorage<DashboardVibesStorage>(
    vibesStorageKey,
    { dayKey: todayKey, vibes: defaultVibes }
  );

  const { state: mediaStorage, setState: setMediaStorage } = useLocalStorage<DashboardMedia>(
    DASHBOARD_MEDIA_STORAGE_KEY,
    {}
  );

  const { state: wishesStorage, setState: setWishesStorage } = useLocalStorage<DashboardWish[]>(
    wishesStorageKey,
    []
  );

  const vibesStorageRef = useRef(vibesStorage);
  const mediaStorageRef = useRef(mediaStorage);
  const wishesStorageRef = useRef(wishesStorage);
  const wishesRef = useRef<DashboardWish[]>(wishesStorage);
  const migratedLegacyKeysRef = useRef<string | null>(null);

  useEffect(() => {
    vibesStorageRef.current = vibesStorage;
  }, [vibesStorage]);

  useEffect(() => {
    mediaStorageRef.current = mediaStorage;
  }, [mediaStorage]);

  useEffect(() => {
    wishesStorageRef.current = wishesStorage;
  }, [wishesStorage]);

  useEffect(() => {
    if (migratedLegacyKeysRef.current === accountId) return;
    migratedLegacyKeysRef.current = accountId;

    const hasCurrentVibes =
      !!vibesStorageRef.current.vibes.marija.text.trim() ||
      !!vibesStorageRef.current.vibes.aco.text.trim();
    const legacyVibes = getStorageValue<DashboardVibesStorage>(LEGACY_VIBES_STORAGE_KEY);

    if (!hasCurrentVibes && legacyVibes) {
      setVibesStorage(legacyVibes);
    }
  }, [accountId, setVibesStorage]);

  useEffect(() => {
    if (vibesStorage.dayKey === todayKey) return;

    setVibesStorage({
      dayKey: todayKey,
      vibes: defaultVibes,
      lastExpired: { dayKey: vibesStorage.dayKey, vibes: vibesStorage.vibes },
    });
  }, [defaultVibes, setVibesStorage, todayKey, vibesStorage.dayKey, vibesStorage.vibes]);

  const activeVibes = vibesStorage.dayKey === todayKey ? vibesStorage.vibes : defaultVibes;
  const marijaVibe = activeVibes.marija;
  const acoVibe = activeVibes.aco;

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
  const [wishes, setWishes] = useState<DashboardWish[]>(wishesStorage);

  const editingWish = useMemo(
    () => (editingWishId ? (wishes.find((wish) => wish.id === editingWishId) ?? null) : null),
    [editingWishId, wishes]
  );

  useEffect(() => {
    wishesRef.current = wishes;
  }, [wishes]);

  const grantWishIfMatch = useCallback(
    async (location: DashboardLocation) => {
      const wishesSnapshot = wishesRef.current;
      if (!wishesSnapshot.length) return;

      const targetKey = getPrimaryPlaceName(location.name);

      let match = wishesSnapshot.find(
        (wish) => getPrimaryPlaceName(wish.location.name) === targetKey
      );

      if (!match) {
        let best: { wish: DashboardWish; distance: number } | null = null;

        for (const wish of wishesSnapshot) {
          const distance = haversineDistanceKm(wish.location.coordinates, location.coordinates);
          if (distance > WISH_GRANT_DISTANCE_KM) continue;
          if (!best || distance < best.distance) best = { wish, distance };
        }

        match = best?.wish;
      }

      if (!match) return;

      const next = wishesSnapshot.filter((wish) => wish.id !== match.id);
      setWishes(next);
      setWishesStorage(next);
      setGrantedWish(match);
      setIsWishGrantedOpen(true);

      if (!isSupabaseReady) return;

      try {
        await deleteDashboardWish({ ownerId: 'shared', id: match.id });
      } catch (error) {
        if (isMissingWishesTableError(error)) return;
      }
    },
    [setWishes, setWishesStorage]
  );

  const handleCloseWishGranted = useCallback(() => {
    setIsWishGrantedOpen(false);
    setGrantedWish(null);
  }, []);

  const handleUndoWishGranted = useCallback(async () => {
    if (!grantedWish) return;

    try {
      if (isSupabaseReady) {
        const created = await createDashboardWish({
          ownerId: 'shared',
          destination: {
            name: grantedWish.location.name,
            coordinates: grantedWish.location.coordinates,
          },
          note: grantedWish.note,
        });

        const next = [created, ...wishesRef.current];
        setWishes(next);
        setWishesStorage(next);
      } else {
        const next = [grantedWish, ...wishesRef.current];
        setWishes(next);
        setWishesStorage(next);
      }
    } catch (error) {
      void error;
    } finally {
      handleCloseWishGranted();
    }
  }, [grantedWish, handleCloseWishGranted, setWishes, setWishesStorage]);

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

  const wishPlaces = useMemo<GlobePlace[]>(
    () =>
      wishes.map((wish) => ({
        id: `${WISH_PLACE_PREFIX}${wish.id}`,
        name: wish.location.name,
        status: 'wishlist',
        coordinates: wish.location.coordinates,
        memories: [],
      })),
    [wishes]
  );

  const globePlaces = useMemo(
    () => [...memoryDrivenPlaces, ...wishPlaces],
    [memoryDrivenPlaces, wishPlaces]
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
        const fetched = await listDashboardMemories('shared');
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
    if (isSupabaseReady) return;
    setWishes(wishesStorage);
    setWishLoadError(null);
  }, [wishesStorage]);

  useEffect(() => {
    if (!isSupabaseReady) return undefined;

    let active = true;

    const fetchWishes = async () => {
      try {
        const fetched = await listDashboardWishes('shared');
        if (!active) return;

        setWishes(fetched);
        setWishesStorage(fetched);
        setWishLoadError(null);
      } catch (error) {
        if (!active) return;
        if (isMissingWishesTableError(error)) {
          setWishes(wishesStorageRef.current);
          setWishLoadError(null);
          return;
        }
        setWishLoadError(getErrorMessage(error));
      }
    };

    void fetchWishes();
    const intervalId = window.setInterval(fetchWishes, 5 * 60_000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [setWishesStorage, wishesStorageKey]);

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
        const remoteVibes = await loadTodayVibes(todayKey, defaultVibes, 'shared');
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
  }, [accountId, defaultVibes, setVibesStorage, todayKey]);

  useEffect(() => {
    if (!isSupabaseReady || !didHydrateRemoteVibes) return undefined;

    const timeoutId = window.setTimeout(async () => {
      setIsSavingVibes(true);
      setVibeSaveError(null);

      try {
        const vibeToSave = currentPerson === 'marija' ? marijaVibe : acoVibe;
        await saveTodayVibe({
          dayKey: todayKey,
          person: currentPerson,
          vibe: vibeToSave,
          ownerId: 'shared',
        });
      } catch (error) {
        setVibeSaveError(getErrorMessage(error));
      } finally {
        setIsSavingVibes(false);
      }
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [acoVibe, didHydrateRemoteVibes, currentPerson, marijaVibe, todayKey]);

  const heroImage = mediaStorage.heroImage;
  const marijaAvatar = mediaStorage.marijaAvatar ?? '/assets/images/mock/avatar/avatar-24.webp';
  const acoAvatar = mediaStorage.acoAvatar ?? '/assets/images/mock/avatar/avatar-23.webp';

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
    <DashboardContent maxWidth="xl" disablePadding sx={{ mb: { sm: 2 } }}>
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

        <Card
          sx={(theme) => ({
            position: 'relative',
            zIndex: 1,
            mt: -10,
            overflow: 'visible',
            willChange: 'transform',
            borderRadius: { xs: 0, sm: 3 },
            pb: 14,
            border: {
              xs: 'none',
              sm: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
            },
            bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.88),
            backdropFilter: 'blur(14px)',
          })}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: '50%',
              zIndex: 10,
              transform: 'translate(-50%, -50%)',
              willChange: 'transform',
              width: '100%',
              maxWidth: { xs: 288, sm: 320, md: 360 },
            }}
          >
            <DashboardStoryCard />
          </Box>
          <Box
            sx={{
              px: { xs: 2, sm: 3, md: 4 },
              pt: { xs: 14, md: 10 },
              pb: { xs: 3, md: 4 },
            }}
          >
            <DashboardVibes
              authenticated={authenticated}
              marija={marijaVibe}
              aco={acoVibe}
              currentPerson={currentPerson}
              onOpenNote={() => setIsTodayVibeOpen(true)}
            />

            {memoryLoadError ? (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  display: 'block',
                  mb: 1.25,
                  color: theme.vars.palette.error.main,
                })}
              >
                {memoryLoadError}
              </Typography>
            ) : null}

            {wishLoadError ? (
              <Typography
                variant="caption"
                sx={(theme) => ({
                  display: 'block',
                  mb: 1.25,
                  color: theme.vars.palette.error.main,
                })}
              >
                {wishLoadError}
              </Typography>
            ) : null}

            <DashboardUserMemories memories={memories} />

            <DashboardLoveGlobeSection
              places={globePlaces}
              wishes={wishes}
              onOpenMap={() => router.push(paths.dashboard.map)}
              onOpenPlace={(placeId) => {
                if (placeId.startsWith(WISH_PLACE_PREFIX)) {
                  setWishSubmitError(null);
                  setEditingWishId(placeId.slice(WISH_PLACE_PREFIX.length));
                  setIsWishDialogOpen(true);
                  return;
                }

                setSelectedPlace(globePlaces.find((place) => place.id === placeId) ?? null);
              }}
              onAddWish={() => {
                setWishSubmitError(null);
                setEditingWishId(null);
                setIsWishDialogOpen(true);
              }}
              onEditWish={(wishId) => {
                setWishSubmitError(null);
                setEditingWishId(wishId);
                setIsWishDialogOpen(true);
              }}
            />

            <Box sx={{ height: { xs: 16, md: 24 } }} />
          </Box>
        </Card>
      </Box>

      <DashboardPlaceGalleryDialog place={selectedPlace} onClose={() => setSelectedPlace(null)} />

      <DashboardWishDialog
        open={isWishDialogOpen}
        wish={editingWish}
        submitting={isSavingWish}
        submitError={wishSubmitError}
        onClose={() => {
          if (isSavingWish) return;
          setWishSubmitError(null);
          setIsWishDialogOpen(false);
          setEditingWishId(null);
        }}
        onSubmit={async ({ location, note }) => {
          if (isSavingWish) return;

          setWishSubmitError(null);
          setIsSavingWish(true);

          try {
            if (isSupabaseReady) {
              if (editingWish) {
                const updated = await updateDashboardWish({
                  ownerId: 'shared',
                  id: editingWish.id,
                  destination: { name: location.name, coordinates: location.coordinates },
                  note,
                });

                const next = wishesRef.current.map((item) =>
                  item.id === updated.id ? updated : item
                );
                setWishes(next);
                setWishesStorage(next);
              } else {
                const created = await createDashboardWish({
                  ownerId: 'shared',
                  destination: { name: location.name, coordinates: location.coordinates },
                  note,
                });

                const next = [created, ...wishesRef.current];
                setWishes(next);
                setWishesStorage(next);
              }
            } else {
              const newId =
                typeof crypto !== 'undefined' && 'randomUUID' in crypto
                  ? crypto.randomUUID()
                  : String(Date.now());

              if (editingWish) {
                const updated: DashboardWish = { ...editingWish, location, note };
                const next = wishesRef.current.map((item) =>
                  item.id === updated.id ? updated : item
                );
                setWishes(next);
                setWishesStorage(next);
              } else {
                const created: DashboardWish = { id: newId, location, note };
                const next = [created, ...wishesRef.current];
                setWishes(next);
                setWishesStorage(next);
              }
            }

            setIsWishDialogOpen(false);
            setEditingWishId(null);
          } catch (error) {
            if (isMissingWishesTableError(error)) {
              setWishSubmitError(
                'Želje još nisu omogućene u Supabase-u. Pokreni "npx supabase db push" pa pokušaj ponovo.'
              );
            } else {
              setWishSubmitError(getErrorMessage(error));
            }
          } finally {
            setIsSavingWish(false);
          }
        }}
        onDelete={
          editingWish
            ? async () => {
                if (isSavingWish || !editingWish) return;

                setWishSubmitError(null);
                setIsSavingWish(true);

                try {
                  if (isSupabaseReady) {
                    await deleteDashboardWish({ ownerId: 'shared', id: editingWish.id });
                  }

                  const next = wishesRef.current.filter((item) => item.id !== editingWish.id);
                  setWishes(next);
                  setWishesStorage(next);

                  setIsWishDialogOpen(false);
                  setEditingWishId(null);
                } catch (error) {
                  if (isMissingWishesTableError(error)) {
                    setWishSubmitError(
                      'Želje još nisu omogućene u Supabase-u. Pokreni "npx supabase db push" pa pokušaj ponovo.'
                    );
                  } else {
                    setWishSubmitError(getErrorMessage(error));
                  }
                } finally {
                  setIsSavingWish(false);
                }
              }
            : undefined
        }
      />

      <AddMemoryDialog
        open={isAddMemoryOpen}
        onClose={() => {
          if (isSavingMemory) return;
          setMemorySubmitError(null);
          setIsAddMemoryOpen(false);
          clearDialogParam('add-memory');
        }}
        submitting={isSavingMemory}
        submitError={memorySubmitError}
        onSubmit={async (draft) => {
          setMemorySubmitError(null);
          setIsSavingMemory(true);

          try {
            if (isSupabaseReady) {
              const savedMemory = await createDashboardMemory(
                { ...draft, addedBy: currentPerson },
                'shared'
              );
              setMemories((prev) => [savedMemory, ...prev]);
              void grantWishIfMatch(savedMemory.location);
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
                  addedBy: currentPerson,
                  photoCount: 1,
                },
                ...prev,
              ]);
              void grantWishIfMatch(draft.location);
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
        currentPerson={currentPerson}
        marija={marijaVibe}
        aco={acoVibe}
        onClose={() => {
          setIsTodayVibeOpen(false);
          clearDialogParam('today-vibe');
        }}
        onChangeMarija={(next) => updateVibe('marija', next)}
        onChangeAco={(next) => updateVibe('aco', next)}
        isSaving={isSavingVibes}
        saveError={vibeSaveError}
      />

      <Snackbar
        open={isWishGrantedOpen}
        autoHideDuration={6500}
        onClose={handleCloseWishGranted}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseWishGranted}
          severity="success"
          variant="filled"
          action={
            <Button color="inherit" size="small" onClick={handleUndoWishGranted}>
              Poništi
            </Button>
          }
          sx={{ width: 1 }}
        >
          Želja ispunjena{grantedWish ? `: ${grantedWish.location.name.split(',')[0]}` : ''}.
        </Alert>
      </Snackbar>
    </DashboardContent>
  );
}
