import type { ChangeEvent, PointerEvent } from 'react';

import { varAlpha } from 'minimal-shared/utils';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

type Props = {
  open: boolean;
  title: string;
  subtitle: string;
  imageSrc?: string;
  onClose: () => void;
  onChangeImage: (file: File) => void;
  isSaving?: boolean;
  error?: string | null;
  warning?: string | null;
};

export function DashboardMediaViewerDialog({
  open,
  title,
  subtitle,
  imageSrc,
  onClose,
  onChangeImage,
  isSaving = false,
  error,
  warning,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const previewAreaRef = useRef<HTMLDivElement | null>(null);

  const [isZooming, setIsZooming] = useState(false);
  const [zoomOrigin, setZoomOrigin] = useState('50% 50%');

  useEffect(() => {
    if (open) return;
    setIsZooming(false);
    setZoomOrigin('50% 50%');
  }, [open]);

  const updateZoomOrigin = (clientX: number, clientY: number) => {
    const bounds = previewAreaRef.current?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;

    const x = ((clientX - bounds.left) / bounds.width) * 100;
    const y = ((clientY - bounds.top) / bounds.height) * 100;

    const clampedX = Math.min(100, Math.max(0, x));
    const clampedY = Math.min(100, Math.max(0, y));

    setZoomOrigin(`${clampedX}% ${clampedY}%`);
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    updateZoomOrigin(event.clientX, event.clientY);
    setIsZooming(true);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isZooming || !imageSrc) return;
    updateZoomOrigin(event.clientX, event.clientY);
  };

  const handlePointerUp = () => {
    setIsZooming(false);
  };

  const handleFileInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = '';
    if (!file) return;
    onChangeImage(file);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
              {subtitle}
            </Typography>
            {error ? (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.error.main })}>
                {error}
              </Typography>
            ) : warning ? (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.warning.main })}>
                {warning}
              </Typography>
            ) : (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                Press and hold to zoom in, release to zoom out
              </Typography>
            )}
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ p: { xs: 1.5, sm: 2 } }}>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <Box
          ref={previewAreaRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerUp}
          sx={(theme) => ({
            width: 1,
            height: { xs: 300, sm: 440 },
            borderRadius: 2.5,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: varAlpha(theme.vars.palette.text.primaryChannel, 0.08),
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
            touchAction: 'none',
            cursor: imageSrc ? (isZooming ? 'zoom-in' : 'grab') : 'default',
          })}
        >
          {imageSrc ? (
            <Box
              sx={{
                width: 1,
                height: 1,
                backgroundImage: `url(${imageSrc})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${isZooming ? 1.9 : 1})`,
                transformOrigin: zoomOrigin,
                transition: isZooming
                  ? 'transform 90ms linear'
                  : 'transform 320ms cubic-bezier(0.22, 1, 0.36, 1)',
                willChange: 'transform',
              }}
            />
          ) : (
            <Stack sx={{ width: 1, height: 1 }} alignItems="center" justifyContent="center" spacing={1}>
              <Iconify icon="solar:gallery-add-bold-duotone" width={30} />
              <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                No image yet
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="outlined"
          onClick={() => fileInputRef.current?.click()}
          disabled={isSaving}
          startIcon={
            isSaving ? (
              <CircularProgress color="inherit" size={16} />
            ) : (
              <Iconify icon="solar:pen-new-square-bold-duotone" width={18} />
            )
          }
        >
          {isSaving ? 'Saving…' : 'Edit image'}
        </Button>
        <Button variant="contained" onClick={onClose}>
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
