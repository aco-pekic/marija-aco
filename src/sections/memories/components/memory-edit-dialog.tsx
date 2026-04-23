import type {
  DashboardMemoryDetails,
  DashboardMemoryUpdateInput,
  DashboardMemoryPhotoUpdateInput,
} from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  memory: DashboardMemoryDetails | null;
  submitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (value: DashboardMemoryUpdateInput) => void;
};

function normalizePhotos(photos: DashboardMemoryPhotoUpdateInput[]) {
  return photos.map((photo, index) => ({ ...photo, sortOrder: index }));
}

export function MemoryEditDialog({
  open,
  memory,
  submitting = false,
  error,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState('');
  const [sharedNote, setSharedNote] = useState('');
  const [photos, setPhotos] = useState<DashboardMemoryPhotoUpdateInput[]>([]);

  useEffect(() => {
    if (!open || !memory) return;

    setTitle(memory.title ?? '');
    setDescription(memory.description ?? '');
    setDate(memory.date);
    setSharedNote(memory.sharedNote ?? '');
    setPhotos(
      normalizePhotos(
        memory.photos.map((photo, index) => ({
          id: photo.id,
          imageSrc: photo.imageSrc,
          caption: photo.caption ?? '',
          sortOrder: index,
        }))
      )
    );
  }, [memory, open]);

  const coverImageSrc = photos[0]?.imageSrc ?? memory?.imageSrc;
  const photoCountLabel = useMemo(
    () =>
      `${photos.length} fotografij${photos.length === 1 ? 'a' : photos.length < 5 ? 'e' : 'a'} u redosledu`,
    [photos.length]
  );

  const movePhoto = (index: number, direction: 'left' | 'right') => {
    const nextIndex = direction === 'left' ? index - 1 : index + 1;
    if (nextIndex < 0 || nextIndex >= photos.length) return;

    const nextPhotos = [...photos];
    [nextPhotos[index], nextPhotos[nextIndex]] = [nextPhotos[nextIndex], nextPhotos[index]];
    setPhotos(normalizePhotos(nextPhotos));
  };

  const makeCover = (index: number) => {
    if (index <= 0) return;

    const nextPhotos = [...photos];
    const [selected] = nextPhotos.splice(index, 1);
    nextPhotos.unshift(selected);
    setPhotos(normalizePhotos(nextPhotos));
  };

  const updateCaption = (index: number, caption: string) => {
    setPhotos((current) =>
      current.map((photo, currentIndex) => (currentIndex === index ? { ...photo, caption } : photo))
    );
  };

  return (
    <Dialog open={open} onClose={submitting ? undefined : onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ pb: 1 }}>Izmeni uspomenu</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          <Card
            sx={(theme) => ({
              p: 2.5,
              borderRadius: 3,
              bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.7),
            })}
          >
            <Stack spacing={2}>
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="h6">Detalji priče</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Izmeni naslov, kratku priču, datum i zajedničku belešku.
                  </Typography>
                </Box>
                <Chip label={photoCountLabel} color="secondary" variant="outlined" />
              </Stack>

              <TextField
                label="Naslov"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Mali naslov za ovaj dan"
              />

              <TextField
                label="Datum"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />

              <TextField
                label="Beleška uspomene"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Šta se desilo, šta je bilo posebno, detalji koje ne želiš da zaboraviš..."
                multiline
                minRows={3}
              />

              <TextField
                label="Zajednička beleška"
                value={sharedNote}
                onChange={(event) => setSharedNote(event.target.value)}
                placeholder="Mala beleška samo za vas dvoje"
                multiline
                minRows={4}
              />
            </Stack>
          </Card>

          <Card
            sx={(theme) => ({
              p: 2.5,
              borderRadius: 3,
              bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.7),
            })}
          >
            <Stack spacing={2.5}>
              <Box>
                <Typography variant="h6">Poređaj fotografije</Typography>
                <Typography variant="body2" color="text.secondary">
                  Prva fotografija je naslovna. Trenutno bez prevlačenja, ali možeš lako da menjaš
                  redosled strelicama.
                </Typography>
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gap: 2,
                  gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
                }}
              >
                {photos.map((photo, index) => (
                  <Card
                    key={photo.id}
                    sx={(theme) => ({
                      p: 1.5,
                      borderRadius: 3,
                      border: `1px solid ${
                        photo.imageSrc === coverImageSrc
                          ? varAlpha(theme.vars.palette.secondary.mainChannel, 0.4)
                          : varAlpha(theme.vars.palette.common.whiteChannel, 0.1)
                      }`,
                      boxShadow:
                        photo.imageSrc === coverImageSrc
                          ? `0 18px 42px -28px ${varAlpha(theme.vars.palette.secondary.mainChannel, 0.8)}`
                          : 'none',
                    })}
                  >
                    <Stack spacing={1.5}>
                      <Box sx={{ position: 'relative', overflow: 'hidden', borderRadius: 2 }}>
                        <Image
                          src={photo.imageSrc}
                          alt={`Memory photo ${index + 1}`}
                          ratio="4/3"
                          visibleByDefault
                        />
                        {index === 0 ? (
                          <Chip
                            label="Naslovna"
                            color="secondary"
                            sx={{ position: 'absolute', top: 10, left: 10 }}
                          />
                        ) : null}
                      </Box>

                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Stack direction="row" spacing={1}>
                          <IconButton
                            size="small"
                            onClick={() => movePhoto(index, 'left')}
                            disabled={index === 0 || submitting}
                          >
                            <Iconify icon="solar:arrow-left-line-duotone" width={18} />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => movePhoto(index, 'right')}
                            disabled={index === photos.length - 1 || submitting}
                          >
                            <Iconify icon="solar:arrow-right-line-duotone" width={18} />
                          </IconButton>
                        </Stack>

                        <Button
                          size="small"
                          variant={index === 0 ? 'contained' : 'outlined'}
                          onClick={() => makeCover(index)}
                          disabled={index === 0 || submitting}
                        >
                          {index === 0 ? 'Glavna naslovna' : 'Postavi kao naslovnu'}
                        </Button>
                      </Stack>

                      <TextField
                        label="Opis"
                        value={photo.caption ?? ''}
                        onChange={(event) => updateCaption(index, event.target.value)}
                        placeholder="Kratak opis za ovu fotografiju"
                        multiline
                        minRows={2}
                      />
                    </Stack>
                  </Card>
                ))}
              </Box>
            </Stack>
          </Card>

          {error ? (
            <Typography variant="body2" color="error.main">
              {error}
            </Typography>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} disabled={submitting}>
          Otkaži
        </Button>
        <Button
          variant="contained"
          onClick={() =>
            onSubmit({
              title,
              description,
              date,
              sharedNote,
              coverImageSrc,
              photos,
            })
          }
          disabled={submitting || !date || !photos.length}
          startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
        >
          Sačuvaj izmene
        </Button>
      </DialogActions>
    </Dialog>
  );
}
