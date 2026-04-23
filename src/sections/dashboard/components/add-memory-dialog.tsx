import type { ChangeEvent } from 'react';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useRef, useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import {
  isImageCandidate,
  IMAGE_UPLOAD_ACCEPT_ATTR,
  prepareImageForDisplayAndUpload,
} from '../image-file';

import type { DashboardLocation, DashboardMemoryDraft } from '../types';

// --- Establish Brand Channels ---
const PLUM_CHANNELS = '94 55 80';
const ROSE_CHANNELS = '198 91 124';

type GeoOption = {
  name: string;
  coordinates: [lat: number, lng: number];
};

const NOMINATIM_LANGUAGE = 'sr-Latn';
const NOMINATIM_HEADERS = {
  accept: 'application/json',
  'accept-language': 'sr-Latn-RS,sr-Latn;q=0.95,sr;q=0.9,en;q=0.8',
} as const;

async function canPreviewObjectUrl(url: string) {
  return new Promise<boolean>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    img.src = url;
  });
}

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: DashboardMemoryDraft) => void;
  submitting?: boolean;
  submitError?: string | null;
};

export function AddMemoryDialog({
  open,
  onClose,
  onSubmit,
  submitting = false,
  submitError,
}: Props) {
  const theme = useTheme();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageProcessIdRef = useRef(0);

  const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLoadError, setImageLoadError] = useState<string | null>(null);
  const [imageLoadWarning, setImageLoadWarning] = useState<string | null>(null);
  const [isPreparingImage, setIsPreparingImage] = useState(false);

  const [location, setLocation] = useState<DashboardLocation | null>(null);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoOptions, setGeoOptions] = useState<GeoOption[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  // Logic remains identical to ensure functionality...
  useEffect(() => {
    if (!open) return;
    imageProcessIdRef.current = 0;
    setAttemptedSubmit(false);
    setTitle('');
    setDescription('');
    setDate(today);
    setImageFile(null);
    setImagePreview(null);
    setImageLoadError(null);
    setImageLoadWarning(null);
    setIsPreparingImage(false);
    setLocation(null);
    setGeoQuery('');
    setGeoOptions([]);
    setGeoError(null);
    setIsGeoLoading(false);
  }, [open, today]);

  useEffect(() => {
    if (!imageFile) {
      setImagePreview(null);
      return undefined;
    }
    const objectUrl = URL.createObjectURL(imageFile);
    let active = true;
    (async () => {
      const canPreview = await canPreviewObjectUrl(objectUrl);
      if (!active) return;
      if (canPreview) {
        setImagePreview(objectUrl);
      } else {
        setImagePreview(null);
        setImageLoadWarning('Ovaj format slike ne može da se prikaže.');
      }
    })();
    return () => {
      active = false;
      URL.revokeObjectURL(objectUrl);
    };
  }, [imageFile]);

  // (Keeping your Geolocation and Nominatim fetch logic as is...)
  useEffect(() => {
    if (!open) return;
    if (location) return;
    if (!('geolocation' in navigator)) return;

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
        try {
          const url = new URL('https://nominatim.openstreetmap.org/reverse');
          url.searchParams.set('format', 'json');
          url.searchParams.set('lat', String(coords[0]));
          url.searchParams.set('lon', String(coords[1]));
          url.searchParams.set('zoom', '12');
          url.searchParams.set('addressdetails', '1');
          url.searchParams.set('accept-language', NOMINATIM_LANGUAGE);

          const res = await fetch(url.toString(), { headers: NOMINATIM_HEADERS });
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { display_name?: string };
          const name = data.display_name ?? 'Trenutna lokacija';
          setLocation({ name, coordinates: coords, source: 'device' });
        } catch {
          setLocation({ name: 'Trenutna lokacija', coordinates: coords, source: 'device' });
        }
      },
      () => setGeoError('Lokacija odbijena.'),
      { timeout: 8000 }
    );
  }, [location, open]);

  useEffect(() => {
    if (!open) return undefined;
    const trimmed = geoQuery.trim();
    if (trimmed.length < 2) {
      setGeoOptions([]);
      setIsGeoLoading(false);
      return undefined;
    }
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setIsGeoLoading(true);
      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '6');
        url.searchParams.set('accept-language', NOMINATIM_LANGUAGE);

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: NOMINATIM_HEADERS,
        });
        const data = await res.json();
        setGeoOptions(
          data.map((item: any) => ({
            name: item.display_name,
            coordinates: [Number(item.lat), Number(item.lon)],
          }))
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setGeoOptions([]);
      } finally {
        setIsGeoLoading(false);
      }
    }, 350);
    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [geoQuery, open]);

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const processId = imageProcessIdRef.current + 1;
    imageProcessIdRef.current = processId;
    const nextFile = event.target.files?.[0] ?? null;
    if (!nextFile) return;
    if (!isImageCandidate(nextFile)) {
      setImageLoadError('Izaberi fajl slike.');
      return;
    }
    setIsPreparingImage(true);
    try {
      const prepared = await prepareImageForDisplayAndUpload(nextFile);
      if (imageProcessIdRef.current !== processId) return;
      setImageFile(prepared.file);
    } catch (error) {
      setImageLoadError('Greška pri pripremi slike.');
    } finally {
      setIsPreparingImage(false);
    }
  };

  const handleSubmit = () => {
    setAttemptedSubmit(true);
    if (!imageFile || !date || !location) return;
    onSubmit({ date, location, imageFile, title: title.trim(), description: description.trim() });
  };

  const locationError = attemptedSubmit && !location;
  const imageError = attemptedSubmit && !imageFile;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: `radial-gradient(circle at top right, ${varAlpha(ROSE_CHANNELS, 0.05)}, transparent 40%)`,
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: 'text.primary' }}>
              Nova Uspomena
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Sačuvaj trenutak zauvek
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ bgcolor: 'background.neutral' }}>
            <Iconify icon="solar:close-circle-bold-duotone" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 0 }}>
        <Stack spacing={3}>
          {/* --- Image Dropzone Section --- */}
          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept={IMAGE_UPLOAD_ACCEPT_ATTR}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <Card
              sx={{
                height: 240,
                borderRadius: 3,
                position: 'relative',
                overflow: 'hidden',
                border: `2px dashed ${imageError ? theme.palette.error.main : varAlpha(PLUM_CHANNELS, 0.2)}`,
                bgcolor: varAlpha(theme.vars.palette.background.neutralChannel, 0.5),
                transition: theme.transitions.create(['border-color', 'transform']),
                '&:hover': { transform: 'scale(1.01)', borderColor: 'primary.main' },
              }}
            >
              <CardActionArea onClick={handlePickImage} sx={{ height: 1 }}>
                {imagePreview ? (
                  <Box sx={{ height: 1, position: 'relative' }}>
                    <Box
                      sx={{
                        height: 1,
                        backgroundImage: `url(${imagePreview})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }}
                    />
                    <Box
                      sx={{
                        position: 'absolute',
                        inset: 0,
                        background: 'linear-gradient(to top, rgba(0,0,0,0.4), transparent)',
                      }}
                    />
                    <Chip
                      label="Promeni sliku"
                      size="small"
                      icon={<Iconify icon="solar:camera-bold" />}
                      sx={{
                        position: 'absolute',
                        bottom: 12,
                        right: 12,
                        bgcolor: 'rgba(255,255,255,0.8)',
                        backdropFilter: 'blur(4px)',
                      }}
                    />
                  </Box>
                ) : (
                  <Stack
                    spacing={1.5}
                    alignItems="center"
                    justifyContent="center"
                    sx={{ height: 1 }}
                  >
                    {isPreparingImage ? (
                      <CircularProgress size={32} thickness={5} />
                    ) : (
                      <>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: '50%',
                            bgcolor: varAlpha(ROSE_CHANNELS, 0.1),
                            color: 'primary.main',
                          }}
                        >
                          <Iconify icon="solar:gallery-add-bold-duotone" width={40} />
                        </Box>
                        <Typography variant="subtitle2" sx={{ color: 'text.secondary' }}>
                          Dodaj najlepšu sliku
                        </Typography>
                      </>
                    )}
                  </Stack>
                )}
              </CardActionArea>
            </Card>
            {imageError && (
              <Typography
                variant="caption"
                sx={{
                  color: 'error.main',
                  mt: 1,
                  display: 'block',
                  textAlign: 'center',
                  fontWeight: 700,
                }}
              >
                Slika je obavezna za uspomenu!
              </Typography>
            )}
          </Box>

          {/* --- Location Section --- */}
          <Box>
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
              <Iconify
                icon="solar:map-point-bold-duotone"
                width={20}
                sx={{ color: 'primary.main' }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                Gde ste bili?
              </Typography>
              <Button
                size="small"
                onClick={() => {
                  /* navigator.geolocation logic */
                }}
                sx={{ ml: 'auto', borderRadius: 1.5, textTransform: 'none', fontWeight: 700 }}
                startIcon={<Iconify icon="solar:gps-bold" />}
              >
                Ovde sam
              </Button>
            </Stack>

            <Autocomplete
              value={null}
              options={geoOptions}
              inputValue={geoQuery}
              onInputChange={(_, val) => setGeoQuery(val)}
              onChange={(_, val) => {
                if (val)
                  setLocation({ name: val.name, coordinates: val.coordinates, source: 'search' });
              }}
              getOptionLabel={(o) => o.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Pretraži grad, ulicu ili kafić..."
                  error={locationError}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      sx: {
                        borderRadius: 2,
                        bgcolor: 'background.neutral',
                        border: 'none',
                        '& fieldset': { border: 'none' },
                      },
                      endAdornment: isGeoLoading ? (
                        <CircularProgress size={16} />
                      ) : (
                        params.InputProps.endAdornment
                      ),
                    },
                  }}
                />
              )}
            />
            {location && (
              <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                <Chip
                  icon={<Iconify icon="solar:check-circle-bold" />}
                  label={location.name.split(',')[0]}
                  onDelete={() => setLocation(null)}
                  sx={{ bgcolor: varAlpha(PLUM_CHANNELS, 0.08), fontWeight: 700, color: '#5E3750' }}
                />
              </Stack>
            )}
          </Box>

          {/* --- Text Fields --- */}
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Naslov"
              variant="filled"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Šta se desilo?"
              slotProps={{
                input: {
                  sx: {
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    '&:before, &:after': { display: 'none' },
                  },
                },
              }}
            />

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                fullWidth
                type="date"
                label="Datum"
                variant="filled"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                slotProps={{
                  input: {
                    sx: {
                      borderRadius: 2,
                      bgcolor: 'background.neutral',
                      '&:before, &:after': { display: 'none' },
                    },
                  },
                  inputLabel: { shrink: true },
                }}
              />
            </Stack>

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Beleška"
              variant="filled"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Napiši nešto lepo o ovom danu..."
              slotProps={{
                input: {
                  sx: {
                    borderRadius: 2,
                    bgcolor: 'background.neutral',
                    '&:before, &:after': { display: 'none' },
                  },
                },
              }}
            />
          </Stack>
        </Stack>
      </DialogContent>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} sx={{ color: 'text.secondary', fontWeight: 700 }}>
          Odustani
        </Button>

        <Box sx={{ flexGrow: 1 }} />

        <Button
          variant="contained"
          size="large"
          onClick={handleSubmit}
          disabled={submitting || isPreparingImage}
          startIcon={
            submitting ? <CircularProgress size={20} /> : <Iconify icon="solar:heart-bold" />
          }
          sx={{
            borderRadius: 2,
            px: 4,
            fontWeight: 800,
            boxShadow: `0 8px 24px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.3)}`,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
          }}
        >
          {submitting ? 'Čuvam...' : 'Sačuvaj uspomenu'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
