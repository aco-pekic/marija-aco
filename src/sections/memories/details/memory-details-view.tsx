import type { ChangeEvent } from 'react';
import type {
  DashboardMemory,
  DashboardMemoryDetails,
  DashboardMemoryUpdateInput,
} from 'src/sections/dashboard/types';

import { useLocation } from 'react-router';
import { varAlpha } from 'minimal-shared/utils';
import { useRef, useMemo, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { paths } from 'src/routes/paths';
import { useParams, useRouter } from 'src/routes/hooks';

import { isSupabaseReady } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { Iconify } from 'src/components/iconify';

import { AddMemoryDialog } from 'src/sections/dashboard/components/add-memory-dialog';
import { isImageCandidate, IMAGE_UPLOAD_ACCEPT_ATTR } from 'src/sections/dashboard/image-file';
import {
  RELATIONSHIP_START,
  getRelationshipProgressParts,
} from 'src/sections/dashboard/relationship';
import {
  createDashboardMemory,
  addDashboardMemoryPhotos,
  getDashboardMemoryDetails,
  updateDashboardMemoryPhotos,
  updateDashboardMemoryDetails,
} from 'src/sections/dashboard/supabase';

import { getErrorMessage } from 'src/auth/utils/error-message';

import { MemoryEditDialog } from '../components/memory-edit-dialog';
import { MemoryDetailsHero } from './components/memory-details-hero';
import { getPrimaryPlaceName, buildFallbackMemoryDetails } from './utils';
import { MemoryDetailsLocationCard } from './components/memory-details-location-card';
import { MemoryDetailsGallerySection } from './components/memory-details-gallery-section';
import { MemoryDetailsRelatedSection } from './components/memory-details-related-section';
import { MemoryDetailsSharedNoteCard } from './components/memory-details-shared-note-card';
import { MemoryDetailsTimelineSection } from './components/memory-details-timeline-section';

export function MemoryDetailsView() {
  const router = useRouter();
  const { memoryId } = useParams();
  const routeLocation = useLocation();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const routeState = routeLocation.state as { memory?: DashboardMemory } | null;
  const routeMemory = routeState?.memory;

  const [memory, setMemory] = useState<DashboardMemoryDetails | null>(() =>
    routeMemory ? buildFallbackMemoryDetails(routeMemory) : null
  );
  const [isLoading, setIsLoading] = useState(isSupabaseReady);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddMemoryOpen, setIsAddMemoryOpen] = useState(false);
  const [isSavingMemory, setIsSavingMemory] = useState(false);
  const [memorySubmitError, setMemorySubmitError] = useState<string | null>(null);

  const loadDetails = useCallback(async () => {
    if (!memoryId) {
      setLoadError('Ova uspomena nije pronađena.');
      setIsLoading(false);
      return;
    }

    if (!isSupabaseReady) {
      if (routeMemory?.id === memoryId) {
        setMemory(buildFallbackMemoryDetails(routeMemory));
        setLoadError(null);
      } else {
        setMemory(null);
        setLoadError(
          'Otvori ovu stranicu sa dashboarda ili poveži Supabase da učitaš sačuvane uspomene.'
        );
      }
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const nextMemory = await getDashboardMemoryDetails(memoryId, 'shared');

      if (!nextMemory) {
        setMemory(null);
        setLoadError('Ova uspomena više ne postoji ili pripada drugom prostoru.');
        return;
      }

      setMemory(nextMemory);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Ne mogu da učitam ovu uspomenu.');
    } finally {
      setIsLoading(false);
    }
  }, [memoryId, routeMemory]);

  useEffect(() => {
    void loadDetails();
  }, [loadDetails]);

  const memoryProgress = useMemo(
    () => getRelationshipProgressParts(memory?.date ?? RELATIONSHIP_START),
    [memory?.date]
  );
  const shortPlaceName = useMemo(
    () => getPrimaryPlaceName(memory?.location.name ?? ''),
    [memory?.location.name]
  );

  const handleUploadButtonClick = () => fileInputRef.current?.click();

  const handleUploadPhotos = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []).filter(isImageCandidate);

    if (!memory || !files.length) {
      event.target.value = '';
      return;
    }

    setActionError(null);
    setIsUploadingPhotos(true);

    try {
      await addDashboardMemoryPhotos({ memoryId: memory.id, files, ownerId: 'shared' });
      await loadDetails();
      setToastMessage(
        files.length > 1
          ? `${files.length} fotografij${files.length < 5 ? 'e' : 'a'} je dodato.`
          : 'Fotografija je dodata.'
      );
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Ne mogu da dodam fotografije.');
    } finally {
      event.target.value = '';
      setIsUploadingPhotos(false);
    }
  };

  const handleSaveDetails = async (value: DashboardMemoryUpdateInput) => {
    if (!memory) return;

    setActionError(null);
    setIsSavingDetails(true);

    try {
      const nextCover = value.photos?.[0]?.imageSrc ?? value.coverImageSrc ?? memory.imageSrc;

      await Promise.all([
        updateDashboardMemoryDetails(
          memory.id,
          {
            title: value.title,
            description: value.description,
            date: value.date,
            sharedNote: value.sharedNote,
            coverImageSrc: nextCover,
          },
          'shared'
        ),
        value.photos?.length
          ? updateDashboardMemoryPhotos({ memoryId: memory.id, photos: value.photos })
          : Promise.resolve(),
      ]);

      await loadDetails();
      setIsEditOpen(false);
      setToastMessage('Detalji uspomene su sačuvani.');
    } catch (error) {
      setActionError(
        error instanceof Error ? error.message : 'Ne mogu da sačuvam detalje uspomene.'
      );
    } finally {
      setIsSavingDetails(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardContent
        maxWidth="xl"
        sx={{ minHeight: '70vh', justifyContent: 'center', alignItems: 'center' }}
      >
        <Stack spacing={2} alignItems="center">
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Učitavam uspomenu...
          </Typography>
        </Stack>
      </DashboardContent>
    );
  }

  if (!memory) {
    return (
      <DashboardContent maxWidth="lg" sx={{ py: 6 }}>
        <Card
          sx={(theme) => ({
            borderRadius: 4,
            p: { xs: 3, md: 5 },
            bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.82),
            boxShadow: `0 34px 80px -42px ${varAlpha(theme.vars.palette.common.blackChannel, 0.85)}`,
          })}
        >
          <Stack spacing={2}>
            <Chip
              label="Detalji uspomene"
              color="secondary"
              variant="filled"
              sx={{ width: 'fit-content' }}
            />
            <Typography variant="h3">Ova uspomena nedostaje.</Typography>
            <Typography variant="body1" color="text.secondary">
              {loadError ?? 'Tražena uspomena ne može da se učita.'}
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<Iconify icon="solar:arrow-left-line-duotone" width={18} />}
                onClick={() => router.push(paths.dashboard.root)}
              >
                Nazad na dashboard
              </Button>
            </Box>
          </Stack>
        </Card>
      </DashboardContent>
    );
  }

  return (
    <DashboardContent
      maxWidth="xl"
      disablePadding
      sx={{
        px: { xs: 2, sm: 3, lg: 4 },
        pb: { xs: 4, md: 6 },
        background:
          'linear-gradient(180deg, rgba(255,246,249,0.06) 0%, rgba(255,255,255,0) 22%), radial-gradient(circle at top left, rgba(255,182,193,0.14), transparent 34%), radial-gradient(circle at top right, rgba(255,212,169,0.12), transparent 28%)',
      }}
    >
      <MemoryDetailsHero
        memory={memory}
        shortPlaceName={shortPlaceName}
        memoryProgressCompactLabel={memoryProgress.compactLabel}
        isUploadingPhotos={isUploadingPhotos}
        onBack={() => router.push(paths.dashboard.root)}
        onUploadPhotos={handleUploadButtonClick}
        onEdit={() => setIsEditOpen(true)}
      />

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple
        accept={IMAGE_UPLOAD_ACCEPT_ATTR}
        onChange={handleUploadPhotos}
      />

      <Stack spacing={3} sx={{ mt: 3 }}>
        {loadError ? <Alert severity="warning">{loadError}</Alert> : null}
        {actionError ? <Alert severity="error">{actionError}</Alert> : null}

        <Box
          sx={{
            display: 'grid',
            gap: 3,
            gridTemplateColumns: { xs: '1fr', xl: 'minmax(0, 1.45fr) minmax(360px, 0.95fr)' },
          }}
        >
          <MemoryDetailsGallerySection memory={memory} />

          <Stack spacing={3}>
            <MemoryDetailsSharedNoteCard
              sharedNote={memory.sharedNote}
              updatedAt={memory.updatedAt}
              onEdit={() => setIsEditOpen(true)}
            />
            <MemoryDetailsLocationCard location={memory.location} />
          </Stack>
        </Box>

        <MemoryDetailsTimelineSection memory={memory} onAddNextMemory={() => setIsAddMemoryOpen(true)} />
        <MemoryDetailsRelatedSection memory={memory} />
      </Stack>

      <MemoryEditDialog
        open={isEditOpen}
        memory={memory}
        submitting={isSavingDetails}
        error={actionError}
        onClose={() => {
          if (isSavingDetails) return;
          setIsEditOpen(false);
        }}
        onSubmit={handleSaveDetails}
      />

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
            if (!isSupabaseReady) {
              setMemorySubmitError(
                'Dodavanje uspomena zahteva Supabase. Poveži bazu pa pokušaj ponovo.'
              );
              return;
            }

            await createDashboardMemory(draft, 'shared');
            await loadDetails();
            setIsAddMemoryOpen(false);
            setToastMessage('Uspomena je dodata.');
          } catch (error) {
            setMemorySubmitError(getErrorMessage(error));
          } finally {
            setIsSavingMemory(false);
          }
        }}
      />

      <Snackbar
        open={!!toastMessage}
        autoHideDuration={3200}
        onClose={() => setToastMessage(null)}
        message={toastMessage}
      />
    </DashboardContent>
  );
}
