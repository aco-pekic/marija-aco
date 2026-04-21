import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';
import { useLocalStorage } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { DASHBOARD_SOULMATE_QUOTES } from '../quotes';

type StorageState = {
  currentIndex?: number;
  rotatedAt?: number;
};

type Props = {
  enabled: boolean;
};

const STORAGE_KEY = 'dashboard:loveQuote:v1';
const SIX_HOURS_MS = 6 * 60 * 60 * 1000;

// Previously used API (now disabled per request):
// - https://thequoteshub.com/api/tags/soulmate

function pickRandomIndex(length: number) {
  return Math.floor(Math.random() * length);
}

function pickDifferentIndex(length: number, currentIndex?: number) {
  if (length <= 1) return 0;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = pickRandomIndex(length);
    if (candidate !== currentIndex) return candidate;
  }
  return (currentIndex ?? 0) === 0 ? 1 : 0;
}

export function DashboardLoveQuote({ enabled }: Props) {
  const { state, setState } = useLocalStorage<StorageState>(STORAGE_KEY, {});

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const quote = useMemo(() => {
    const idx = state.currentIndex ?? 0;
    return DASHBOARD_SOULMATE_QUOTES[idx] ?? DASHBOARD_SOULMATE_QUOTES[0] ?? null;
  }, [state.currentIndex]);

  const canFetch = enabled;
  const isStale = !state.rotatedAt || Date.now() - state.rotatedAt >= SIX_HOURS_MS;

  const rotateQuote = () => {
    const nextIndex = pickDifferentIndex(DASHBOARD_SOULMATE_QUOTES.length, state.currentIndex);
    setState({ currentIndex: nextIndex, rotatedAt: Date.now() });
  };

  useEffect(() => {
    if (!canFetch) return undefined;

    if (DASHBOARD_SOULMATE_QUOTES.length === 0) {
      setError('No quotes configured.');
      return undefined;
    }

    if (!state.rotatedAt) {
      setState({
        currentIndex: pickRandomIndex(DASHBOARD_SOULMATE_QUOTES.length),
        rotatedAt: Date.now(),
      });
      return undefined;
    }

    if (!isStale) return undefined;

    rotateQuote();
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch]);

  useEffect(() => {
    if (!canFetch) return undefined;

    const rotatedAt = state.rotatedAt;
    const dueInMs = rotatedAt ? rotatedAt + SIX_HOURS_MS - Date.now() : 0;

    const timeoutId = window.setTimeout(
      () => {
        rotateQuote();
      },
      Math.max(dueInMs + 250, 0)
    );

    return () => window.clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canFetch, state.rotatedAt]);

  if (!enabled) return null;

  return (
    <Card
      sx={(theme) => ({
        mt: 2.5,
        borderRadius: 2,
        overflow: 'hidden',
        position: 'relative',
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.55),
        backdropFilter: 'blur(12px)',
        boxShadow: `0 18px 48px -30px ${varAlpha(theme.vars.palette.common.blackChannel, 0.85)}`,
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at 15% 15%, ${varAlpha(
            theme.vars.palette.secondary.mainChannel,
            0.18
          )} 0%, transparent 42%),
            radial-gradient(circle at 85% 10%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.16)} 0%, transparent 45%),
            radial-gradient(circle at 50% 120%, ${varAlpha(theme.vars.palette.error.mainChannel, 0.1)} 0%, transparent 55%)`,
        })}
      />

      <Stack spacing={1.25} sx={{ position: 'relative', p: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={(theme) => ({
                width: 34,
                height: 34,
                borderRadius: 1.25,
                display: 'grid',
                placeItems: 'center',
                color: theme.vars.palette.common.white,
                bgcolor: varAlpha(theme.vars.palette.error.mainChannel, 0.35),
                boxShadow: `0 12px 32px -20px ${varAlpha(theme.vars.palette.error.mainChannel, 0.85)}`,
              })}
            >
              <Iconify icon="solar:heart-angle-bold-duotone" width={20} />
            </Box>
            <Stack spacing={0.15}>
              <Typography variant="subtitle2">Citati dana</Typography>
              <Typography
                variant="caption"
                sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
              >
                Always random · Refreshes every 6 hours
              </Typography>
            </Stack>
          </Stack>

          <Button
            size="small"
            variant="outlined"
            onClick={() => {
              setIsLoading(true);
              setError(null);
              try {
                rotateQuote();
              } finally {
                setIsLoading(false);
              }
            }}
            disabled={!canFetch || isLoading}
            startIcon={
              isLoading ? (
                <CircularProgress color="inherit" size={16} />
              ) : (
                <Iconify icon="solar:refresh-bold" width={16} />
              )
            }
            sx={{ borderRadius: 1.25 }}
          >
            New
          </Button>
        </Stack>

        {error ? (
          <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.warning.main })}>
            {error}
          </Typography>
        ) : quote ? (
          <Stack spacing={0.75}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: 700,
                lineHeight: 1.35,
                whiteSpace: 'pre-line',
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 5,
                WebkitBoxOrient: 'vertical',
              }}
            >
              “{quote.text}”
            </Typography>
            <Stack direction="row" alignItems="center" justifyContent="space-between">
              <Typography
                variant="caption"
                sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
              >
                — {quote.author}
              </Typography>
            </Stack>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
          >
            Loading your first love quote…
          </Typography>
        )}
      </Stack>
    </Card>
  );
}
