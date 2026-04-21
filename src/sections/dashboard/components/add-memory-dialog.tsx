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
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import Autocomplete from '@mui/material/Autocomplete';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CardActionArea from '@mui/material/CardActionArea';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import type { DashboardLocation, DashboardMemoryDraft } from '../types';

type GeoOption = {
  name: string;
  coordinates: [lat: number, lng: number];
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (draft: DashboardMemoryDraft) => void;
  submitting?: boolean;
  submitError?: string | null;
};

export function AddMemoryDialog({ open, onClose, onSubmit, submitting = false, submitError }: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const today = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(today);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const [location, setLocation] = useState<DashboardLocation | null>(null);
  const [geoQuery, setGeoQuery] = useState('');
  const [geoOptions, setGeoOptions] = useState<GeoOption[]>([]);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const [attemptedSubmit, setAttemptedSubmit] = useState(false);

  useEffect(() => {
    if (!open) return;
    setAttemptedSubmit(false);
    setTitle('');
    setDescription('');
    setDate(today);
    setImageFile(null);
    setImagePreview(null);
    setLocation(null);
    setGeoQuery('');
    setGeoOptions([]);
    setGeoError(null);
    setIsGeoLoading(false);
  }, [open, today]);

  useEffect(() => {
    if (!imageFile) return undefined;

    const objectUrl = URL.createObjectURL(imageFile);
    setImagePreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [imageFile]);

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

          const res = await fetch(url.toString(), {
            headers: {
              accept: 'application/json',
            },
          });

          if (!res.ok) throw new Error('reverse geocode failed');

          const data = (await res.json()) as { display_name?: string };
          const name = data.display_name ?? 'Current location';

          setLocation({ name, coordinates: coords, source: 'device' });
        } catch {
          setLocation({ name: 'Current location', coordinates: coords, source: 'device' });
        }
      },
      () => {
        setGeoError('Location permission denied. You can still search by place name.');
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
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
      setGeoError(null);

      try {
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', trimmed);
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '6');

        const res = await fetch(url.toString(), {
          signal: controller.signal,
          headers: {
            accept: 'application/json',
          },
        });

        if (!res.ok) throw new Error('search failed');

        const data = (await res.json()) as Array<{ display_name: string; lat: string; lon: string }>;
        setGeoOptions(
          data.map((item) => ({
            name: item.display_name,
            coordinates: [Number(item.lat), Number(item.lon)],
          }))
        );
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        setGeoOptions([]);
        setGeoError('Could not search places right now. Try again in a moment.');
      } finally {
        setIsGeoLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [geoQuery, open]);

  const dateError = attemptedSubmit && !date;
  const imageError = attemptedSubmit && !imageFile;
  const locationError = attemptedSubmit && !location;

  const canSubmit = !!imageFile && !!date && !!location;

  const handlePickImage = () => fileInputRef.current?.click();

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextFile = event.target.files?.[0] ?? null;

    if (!nextFile) {
      setImageFile(null);
      return;
    }

    if (!nextFile.type.startsWith('image/')) {
      setImageFile(null);
      return;
    }

    setImageFile(nextFile);
  };

  const handleSubmit = () => {
    if (submitting) return;

    setAttemptedSubmit(true);

    if (!imageFile || !date || !location) return;

    onSubmit({
      date,
      location,
      imageFile,
      title: title.trim() || undefined,
      description: description.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h6">Add memory</Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
              Title and description are optional · Image and date are required
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Stack spacing={2.25}>
          <Box>
            <Stack spacing={1} sx={{ mb: 1 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
                <Stack spacing={0.25}>
                  <Typography variant="subtitle2">Place</Typography>
                  <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                    Default is your device location · You can change it anytime
                  </Typography>
                </Stack>
                <Tooltip title="Use device location">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setGeoError(null);
                      if (!('geolocation' in navigator)) {
                        setGeoError('Geolocation is not supported on this device.');
                        return;
                      }
                      navigator.geolocation.getCurrentPosition(
                        (pos) => {
                          setLocation({
                            name: 'Current location',
                            coordinates: [pos.coords.latitude, pos.coords.longitude],
                            source: 'device',
                          });
                        },
                        () => setGeoError('Location permission denied.'),
                        { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
                      );
                    }}
                    startIcon={<Iconify icon="solar:gps-bold-duotone" />}
                  >
                    Use my location
                  </Button>
                </Tooltip>
              </Stack>

              {location ? (
                <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap' }}>
                  <Chip
                    label={location.source === 'device' ? 'Device' : 'Search'}
                    size="small"
                    color={location.source === 'device' ? 'default' : 'primary'}
                    variant="outlined"
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {location.name}
                  </Typography>
                  <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                    {location.coordinates[0].toFixed(4)}, {location.coordinates[1].toFixed(4)}
                  </Typography>
                  <Button
                    size="small"
                    color="inherit"
                    onClick={() => setLocation(null)}
                    startIcon={<Iconify icon="solar:close-circle-bold" width={18} />}
                    sx={{ ml: 'auto' }}
                  >
                    Clear
                  </Button>
                </Stack>
              ) : null}
            </Stack>

            <Autocomplete
              value={null}
              options={geoOptions}
              inputValue={geoQuery}
              onInputChange={(_, value) => setGeoQuery(value)}
              onChange={(_, value) => {
                if (!value) return;
                setLocation({ name: value.name, coordinates: value.coordinates, source: 'search' });
                setGeoQuery(value.name);
              }}
              filterOptions={(x) => x}
              loading={isGeoLoading}
              getOptionLabel={(option) => option.name}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Search a place"
                  placeholder='Type e.g. "Kopaonik"'
                  error={locationError}
                  helperText={
                    locationError
                      ? 'Place is required'
                      : geoError
                        ? geoError
                        : 'Start typing to search places'
                  }
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
              renderOption={(props, option) => (
                <Box component="li" {...props} key={`${option.name}-${option.coordinates.join(',')}`}>
                  <Stack spacing={0.25} sx={{ py: 0.25 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {option.name.split(',')[0]}
                    </Typography>
                    <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                      {option.name}
                    </Typography>
                  </Stack>
                </Box>
              )}
            />
          </Box>

          <Box>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />

            <Card
              sx={(theme) => ({
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px dashed ${varAlpha(theme.vars.palette.text.primaryChannel, imageError ? 0.4 : 0.22)}`,
                bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.7),
                ...(imageError && {
                  boxShadow: `0 0 0 3px ${varAlpha(theme.vars.palette.error.mainChannel, 0.14)}`,
                }),
              })}
            >
              <CardActionArea onClick={handlePickImage} sx={{ p: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
                  <Box
                    sx={(theme) => ({
                      width: { xs: 1, sm: 180 },
                      height: { xs: 160, sm: 120 },
                      borderRadius: 2,
                      overflow: 'hidden',
                      flex: '0 0 auto',
                      border: `1px solid ${varAlpha(theme.vars.palette.common.blackChannel, 0.08)}`,
                      bgcolor: varAlpha(theme.vars.palette.text.primaryChannel, 0.04),
                      backgroundImage: imagePreview ? `url(${imagePreview})` : undefined,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      display: 'grid',
                      placeItems: 'center',
                    })}
                  >
                    {!imagePreview && (
                      <Stack spacing={0.75} alignItems="center">
                        <Iconify icon="solar:gallery-add-bold-duotone" width={26} />
                        <Typography variant="caption" sx={{ opacity: 0.72 }}>
                          Upload image
                        </Typography>
                      </Stack>
                    )}
                  </Box>

                  <Stack spacing={0.5} sx={{ flex: '1 1 auto', minWidth: 0 }}>
                    <Typography variant="subtitle2">Image</Typography>
                    <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                      {imageFile ? imageFile.name : 'Tap to choose an image (required)'}
                    </Typography>
                    {imageError && (
                      <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.error.main })}>
                        Please add an image
                      </Typography>
                    )}
                    <Box sx={{ pt: 0.75 }}>
                      <Button
                        size="small"
                        variant="contained"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePickImage();
                        }}
                        startIcon={<Iconify icon="solar:upload-minimalistic-bold" />}
                      >
                        Choose image
                      </Button>
                    </Box>
                  </Stack>
                </Stack>
              </CardActionArea>
            </Card>
          </Box>

          <TextField
            label="Title (optional)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Sunset walk"
            fullWidth
          />

          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="A short note…"
            fullWidth
            multiline
            minRows={3}
          />

          <TextField
            label="Date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            fullWidth
            required
            error={dateError}
            helperText={dateError ? 'Date is required' : ' '}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose} disabled={submitting}>
          Cancel
        </Button>
        {submitError ? (
          <Typography
            variant="caption"
            sx={(theme) => ({ mr: 'auto', color: theme.vars.palette.error.main })}
          >
            {submitError}
          </Typography>
        ) : null}
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!canSubmit || submitting}
          startIcon={<Iconify icon="solar:add-square-bold-duotone" />}
        >
          {submitting ? 'Saving…' : 'Add memory'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
