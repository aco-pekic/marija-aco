import type { WheelEvent, ChangeEvent, PointerEvent } from 'react';

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

import { IMAGE_UPLOAD_ACCEPT_ATTR } from '../image-file';

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

type Point = {
  x: number;
  y: number;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.2;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getDistance(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getMidpoint(a: Point, b: Point): Point {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

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

  const pointersRef = useRef<Map<number, Point>>(new Map());
  const dragRef = useRef<{ pointerId: number; lastPoint: Point } | null>(null);
  const pinchRef = useRef<{
    startDistance: number;
    startScale: number;
    startOffset: Point;
  } | null>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState<Point>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const scaleRef = useRef(scale);
  const offsetRef = useRef(offset);

  useEffect(() => {
    scaleRef.current = scale;
  }, [scale]);

  useEffect(() => {
    offsetRef.current = offset;
  }, [offset]);

  useEffect(() => {
    pointersRef.current.clear();
    dragRef.current = null;
    pinchRef.current = null;
    setIsDragging(false);
    setScale(1);
    setOffset({ x: 0, y: 0 });
    scaleRef.current = 1;
    offsetRef.current = { x: 0, y: 0 };
  }, [imageSrc, open]);

  const getRect = () => previewAreaRef.current?.getBoundingClientRect() ?? null;

  const getClampedOffset = (nextOffset: Point, nextScale: number, rect: DOMRect) => {
    if (nextScale <= 1) return { x: 0, y: 0 };

    const maxX = Math.max(0, (rect.width * nextScale - rect.width) / 2);
    const maxY = Math.max(0, (rect.height * nextScale - rect.height) / 2);

    return {
      x: clamp(nextOffset.x, -maxX, maxX),
      y: clamp(nextOffset.y, -maxY, maxY),
    };
  };

  const commitTransform = (nextScale: number, nextOffset: Point) => {
    scaleRef.current = nextScale;
    offsetRef.current = nextOffset;
    setScale(nextScale);
    setOffset(nextOffset);
  };

  const applyScaleAtPoint = (
    nextScale: number,
    clientPoint: Point,
    baseScale = scaleRef.current,
    baseOffset = offsetRef.current
  ) => {
    const rect = getRect();
    if (!rect) return;

    const clampedScale = clamp(nextScale, MIN_SCALE, MAX_SCALE);

    if (clampedScale <= 1) {
      commitTransform(1, { x: 0, y: 0 });
      return;
    }

    const localX = clientPoint.x - rect.left - rect.width / 2;
    const localY = clientPoint.y - rect.top - rect.height / 2;

    const contentX = (localX - baseOffset.x) / baseScale;
    const contentY = (localY - baseOffset.y) / baseScale;

    const nextOffset = {
      x: localX - contentX * clampedScale,
      y: localY - contentY * clampedScale,
    };

    commitTransform(clampedScale, getClampedOffset(nextOffset, clampedScale, rect));
  };

  const updateDragOffset = (deltaX: number, deltaY: number) => {
    const rect = getRect();
    if (!rect) return;

    const nextOffset = {
      x: offsetRef.current.x + deltaX,
      y: offsetRef.current.y + deltaY,
    };

    commitTransform(scaleRef.current, getClampedOffset(nextOffset, scaleRef.current, rect));
  };

  const handleWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!imageSrc) return;

    event.preventDefault();

    const zoomFactor = Math.exp(-event.deltaY * 0.0025);
    const nextScale = clamp(scaleRef.current * zoomFactor, MIN_SCALE, MAX_SCALE);

    applyScaleAtPoint(nextScale, { x: event.clientX, y: event.clientY });
  };

  const handleDoubleClick = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;

    if (scaleRef.current > 1.05) {
      commitTransform(1, { x: 0, y: 0 });
      return;
    }

    applyScaleAtPoint(DOUBLE_TAP_SCALE, { x: event.clientX, y: event.clientY });
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;

    const nextPoint = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, nextPoint);
    event.currentTarget.setPointerCapture?.(event.pointerId);

    const pointers = Array.from(pointersRef.current.values());

    if (pointers.length === 2) {
      const [first, second] = pointers;
      pinchRef.current = {
        startDistance: getDistance(first, second),
        startScale: scaleRef.current,
        startOffset: offsetRef.current,
      };
      dragRef.current = null;
      setIsDragging(false);
      return;
    }

    if (pointers.length === 1 && scaleRef.current > 1) {
      dragRef.current = { pointerId: event.pointerId, lastPoint: nextPoint };
      setIsDragging(true);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!imageSrc) return;
    if (!pointersRef.current.has(event.pointerId)) return;

    const nextPoint = { x: event.clientX, y: event.clientY };
    pointersRef.current.set(event.pointerId, nextPoint);

    const pointers = Array.from(pointersRef.current.values());

    if (pointers.length >= 2 && pinchRef.current) {
      const [first, second] = pointers;
      const currentDistance = getDistance(first, second);

      if (pinchRef.current.startDistance > 1) {
        const ratio = currentDistance / pinchRef.current.startDistance;
        const nextScale = pinchRef.current.startScale * ratio;
        const midpoint = getMidpoint(first, second);

        applyScaleAtPoint(
          nextScale,
          midpoint,
          pinchRef.current.startScale,
          pinchRef.current.startOffset
        );
      }

      return;
    }

    if (!dragRef.current || dragRef.current.pointerId !== event.pointerId) return;
    if (scaleRef.current <= 1) return;

    const deltaX = nextPoint.x - dragRef.current.lastPoint.x;
    const deltaY = nextPoint.y - dragRef.current.lastPoint.y;

    dragRef.current.lastPoint = nextPoint;
    updateDragOffset(deltaX, deltaY);
  };

  const endPointer = (pointerId: number) => {
    pointersRef.current.delete(pointerId);

    const remainingPointers = Array.from(pointersRef.current.entries());

    if (remainingPointers.length < 2) {
      pinchRef.current = null;
    }

    if (remainingPointers.length === 1 && scaleRef.current > 1) {
      const [id, point] = remainingPointers[0];
      dragRef.current = { pointerId: id, lastPoint: point };
      setIsDragging(true);
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    endPointer(event.pointerId);
  };

  const handlePointerCancel = (event: PointerEvent<HTMLDivElement>) => {
    endPointer(event.pointerId);
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
                Uštini ili skroluj za zum · Prevuci za pomeranje · Dupli dodir za zum
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
          accept={IMAGE_UPLOAD_ACCEPT_ATTR}
          onChange={handleFileInput}
          style={{ display: 'none' }}
        />

        <Box
          ref={previewAreaRef}
          onWheel={handleWheel}
          onDoubleClick={handleDoubleClick}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          sx={(theme) => ({
            width: 1,
            height: { xs: 300, sm: 440 },
            borderRadius: 2.5,
            overflow: 'hidden',
            position: 'relative',
            bgcolor: varAlpha(theme.vars.palette.text.primaryChannel, 0.08),
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
            touchAction: 'none',
            userSelect: 'none',
            cursor: imageSrc ? (isDragging ? 'grabbing' : scale > 1 ? 'grab' : 'zoom-in') : 'default',
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
                transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${scale})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 120ms ease-out',
                willChange: 'transform',
              }}
            />
          ) : (
            <Stack sx={{ width: 1, height: 1 }} alignItems="center" justifyContent="center" spacing={1}>
              <Iconify icon="solar:gallery-add-bold-duotone" width={30} />
              <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                Još nema slike
              </Typography>
            </Stack>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          variant="text"
          onClick={() => {
            commitTransform(1, { x: 0, y: 0 });
          }}
          disabled={scale <= 1 && offset.x === 0 && offset.y === 0}
          startIcon={<Iconify icon="solar:refresh-circle-bold" width={18} />}
        >
          Resetuj zum
        </Button>
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
          {isSaving ? 'Čuvam…' : 'Izmeni sliku'}
        </Button>
        <Button variant="contained" onClick={onClose}>
          Gotovo
        </Button>
      </DialogActions>
    </Dialog>
  );
}
