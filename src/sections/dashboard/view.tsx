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
import { TodayVibeDialog } from './components/today-vibe-dialog';
import { AddMemoryDialog } from './components/add-memory-dialog';
import { DashboardStoryCard } from './components/dashboard-story-card';
import { DashboardMapDialog } from './components/dashboard-map-dialog';
import { DashboardBottomNav } from './components/dashboard-bottom-nav';
import { DashboardUserMemories } from './components/dashboard-user-memories';
import { DashboardQuickMemories } from './components/dashboard-quick-memories';
import { DashboardLoveGlobeSection } from './components/dashboard-love-globe-section';
import { DashboardPlaceGalleryDialog } from './components/dashboard-place-gallery-dialog';
import {
  saveTodayVibe,
  loadTodayVibes,
  createDashboardMemory,
  listDashboardMemories,
} from './supabase';

import type { Vibe, GlobePlace, DashboardPerson, DashboardMemory, DashboardVibesStorage } from './types';

const VIBES_STORAGE_KEY = 'dashboard:vibes:v1';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Something went wrong. Please try again.';
}

export function DashboardView() {
  const router = useRouter();
  const { authenticated } = useAuthContext();

  const [isMapOpen, setIsMapOpen] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<GlobePlace | null>(null);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isTodayVibeOpen, setIsTodayVibeOpen] = useState(false);

  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memoryLoadError, setMemoryLoadError] = useState<string | null>(null);
  const [memorySubmitError, setMemorySubmitError] = useState<string | null>(null);

  const [isSavingVibes, setIsSavingVibes] = useState(false);
  const [vibeSaveError, setVibeSaveError] = useState<string | null>(null);
  const [didHydrateRemoteVibes, setDidHydrateRemoteVibes] = useState(!isSupabaseReady);

  const todayKey = dayjs().format('YYYY-MM-DD');
  const defaultVibes = useMemo(
    () => ({ marija: { emoji: '✨', text: '' }, aco: { emoji: '💙', text: '' } }),
    []
  );

  const { state: vibesStorage, setState: setVibesStorage } = useLocalStorage<DashboardVibesStorage>(
    VIBES_STORAGE_KEY,
    { dayKey: todayKey, vibes: defaultVibes }
  );

  const vibesStorageRef = useRef(vibesStorage);
  useEffect(() => {
    vibesStorageRef.current = vibesStorage;
  }, [vibesStorage]);

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
  const [memories, setMemories] = useState<DashboardMemory[]>([]);

  useEffect(
    () => () => {
      memoryObjectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      memoryObjectUrlsRef.current = [];
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
        <DashboardHero />
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
              places={DASHBOARD_PLACES}
              onOpenMap={() => setIsMapOpen(true)}
              onOpenPlace={(placeId) =>
                setSelectedPlace(DASHBOARD_PLACES.find((p) => p.id === placeId) ?? null)
              }
            />

            <DashboardQuickMemories places={DASHBOARD_PLACES} />

            <Box sx={{ height: { xs: 16, md: 24 } }} />
          </Box>
        </Card>
      </Box>

      <DashboardMapDialog
        open={isMapOpen}
        places={DASHBOARD_PLACES}
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
