import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import type { DashboardWish, DashboardLocation } from '../types';

type GeoOption = {
  name: string;
  coordinates: [lat: number, lng: number];
};

const NOMINATIM_LANGUAGE = 'sr-Latn';
const NOMINATIM_HEADERS = {
  accept: 'application/json',
  'accept-language': 'sr-Latn-RS,sr-Latn;q=0.95,sr;q=0.9,en;q=0.8',
} as const;

async function fetchGeoOptions(query: string, signal: AbortSignal) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('addressdetails', '1');
  url.searchParams.set('limit', '6');
  url.searchParams.set('accept-language', NOMINATIM_LANGUAGE);

  const res = await fetch(url.toString(), { signal, headers: { ...NOMINATIM_HEADERS } });
  if (!res.ok) throw new Error('search failed');

  const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;

  return data.map(
    (item): GeoOption => ({
      name: item.display_name,
      coordinates: [Number(item.lat), Number(item.lon)],
    })
  );
}

type Props = {
  open: boolean;
  wish?: DashboardWish | null;
  submitting?: boolean;
  submitError?: string | null;
  onClose: () => void;
  onSubmit: (args: { location: DashboardLocation; note?: string }) => void | Promise<void>;
  onDelete?: () => void | Promise<void>;
};

export function DashboardWishDialog({
  open,
  wish = null,
  submitting = false,
  submitError,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const initialLocation = useMemo<DashboardLocation | null>(() => wish?.location ?? null, [wish?.location]);

  const [location, setLocation] = useState<DashboardLocation | null>(initialLocation);
  const [note, setNote] = useState(wish?.note ?? '');

  const selectedLocationOption = useMemo<GeoOption | null>(() => {
    if (!location) return null;
    return { name: location.name, coordinates: location.coordinates };
  }, [location]);

  const [geoQuery, setGeoQuery] = useState(initialLocation?.name ?? '');
  const [geoOptions, setGeoOptions] = useState<GeoOption[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAttemptedSubmit(false);
    setIsConfirmDeleteOpen(false);
    setLocation(initialLocation);
    setNote(wish?.note ?? '');
    setGeoQuery(initialLocation?.name ?? '');
    setGeoOptions([]);
    setIsGeoLoading(false);
    setGeoError(null);
  }, [initialLocation, open, wish?.note]);

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
      setGeoError(null);

      try {
        const options = await fetchGeoOptions(trimmed, controller.signal);
        setGeoOptions(options);
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setGeoOptions([]);
        setGeoError('Trenutno ne mogu da pretražim mesta. Pokušaj ponovo za trenutak.');
      } finally {
        setIsGeoLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [geoQuery, open]);

  const locationError = attemptedSubmit && !location;

  const canSubmit = !!location && !submitting;

  const destinationHelperText = useMemo(() => {
    if (locationError) return 'Molim te izaberi destinaciju sa liste.';
    if (geoError) return geoError;
    if (location) {
      return 'Sačuvano. Kucaj da pretražiš i izabereš novu destinaciju.';
    }
    return 'Počni da kucaš za pretragu (OpenStreetMap).';
  }, [geoError, location, locationError]);

  const handleSubmit = () => {
    setAttemptedSubmit(true);

    if (!location) return;

    void onSubmit({
      location,
      note: note.trim() ? note.trim() : undefined,
    });
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pr: 7 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="h6">{wish ? 'Izmeni želju' : 'Dodaj želju'}</Typography>
              <Typography
                variant="body2"
                sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65) })}
              >
                Izaberi destinaciju i pojaviće se kao marker na vašem globusu.
              </Typography>
            </Box>
            <IconButton onClick={onClose} aria-label="Zatvori">
              <Iconify icon="solar:close-circle-bold" />
            </IconButton>
          </Stack>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.25}>
            <Autocomplete
              value={selectedLocationOption}
              onChange={(_, nextValue) => {
                if (!nextValue) {
                  setLocation(null);
                  return;
                }

                setLocation({ name: nextValue.name, coordinates: nextValue.coordinates, source: 'search' });
                setGeoQuery(nextValue.name);
              }}
              inputValue={geoQuery}
              onInputChange={(_, nextInput) => {
                setGeoQuery(nextInput);
                if (!nextInput.trim()) setLocation(null);
              }}
              options={geoOptions}
              isOptionEqualToValue={(option, value) =>
                option.name === value.name &&
                option.coordinates[0] === value.coordinates[0] &&
                option.coordinates[1] === value.coordinates[1]
              }
              getOptionLabel={(option) => option.name}
              loading={isGeoLoading}
              filterOptions={(options) => options}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Destinacija"
                  placeholder="Pretraži grad / mesto"
                  error={locationError}
                  helperText={destinationHelperText}
                  slotProps={{
                    input: {
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {isGeoLoading ? <CircularProgress color="inherit" size={18} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    },
                  }}
                />
              )}
            />

            <TextField
              label="Beleška (opciono)"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Zašto želiš da ideš tamo?"
              multiline
              minRows={3}
            />

            {submitError ? (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.error.main })}>
                {submitError}
              </Typography>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 0 }}>
          {wish && onDelete ? (
            <Tooltip title="Ukloni ovu želju">
              <span>
                <Button
                  color="error"
                  variant="outlined"
                  onClick={() => setIsConfirmDeleteOpen(true)}
                  disabled={submitting}
                  startIcon={<Iconify icon="solar:trash-bin-trash-bold" width={18} />}
                >
                  Obriši
                </Button>
              </span>
            </Tooltip>
          ) : (
            <Box sx={{ flexGrow: 1 }} />
          )}

          <Button onClick={onClose} disabled={submitting}>
            Otkaži
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={!canSubmit}>
            {wish ? 'Sačuvaj želju' : 'Dodaj želju'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={isConfirmDeleteOpen} onClose={() => setIsConfirmDeleteOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Obrisati želju?</DialogTitle>
        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
            Ovo će ukloniti marker sa vašeg LoveGlobe-a.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.25 }}>
          <Button onClick={() => setIsConfirmDeleteOpen(false)} disabled={submitting}>
            Otkaži
          </Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              setIsConfirmDeleteOpen(false);
              void onDelete?.();
            }}
            disabled={submitting}
          >
            Obriši
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
