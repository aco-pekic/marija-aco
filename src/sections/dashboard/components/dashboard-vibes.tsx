import { useCountdownDate } from 'minimal-shared/hooks';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { VibeCard } from './vibe-card';
import { DashboardLoveQuote } from './dashboard-love-quote';

import type { Vibe } from '../types';

type Props = {
  authenticated: boolean;
  resetAt: Date;
  marija: Vibe;
  aco: Vibe;
  onChangeMarija: (next: Vibe) => void;
  onChangeAco: (next: Vibe) => void;
  onOpenNote?: () => void;
};

export function DashboardVibes({
  authenticated,
  resetAt,
  marija,
  aco,
  onChangeMarija,
  onChangeAco,
  onOpenNote,
}: Props) {
  const { days, hours, minutes, seconds } = useCountdownDate(resetAt);

  const resetsIn =
    days !== '- -' && days !== '00' ? `${days}d ${hours}:${minutes}:${seconds}` : `${hours}:${minutes}:${seconds}`;

  const hasNotes = !!marija.text.trim() || !!aco.text.trim();

  return (
    <Box>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
          <Typography variant="h6">Today vibe</Typography>
          <Typography
            variant="caption"
            sx={(theme) => ({
              color: theme.vars.palette.text.secondary,
              fontWeight: 700,
              letterSpacing: 0.2,
            })}
          >
            Resets in {resetsIn}
          </Typography>
        </Stack>
        {hasNotes ? (
          <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
            Little notes for today
          </Typography>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
              No notes yet
            </Typography>
            {onOpenNote ? (
              <Button size="small" variant="contained" onClick={onOpenNote}>
                Add today note
              </Button>
            ) : null}
          </Stack>
        )}
      </Stack>

      {hasNotes ? (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
            gap: 2,
          }}
        >
          <VibeCard title="Marija" value={marija} onChange={onChangeMarija} />
          <VibeCard title="Aco" value={aco} onChange={onChangeAco} />
        </Box>
      ) : null}

      <DashboardLoveQuote enabled={authenticated} />
    </Box>
  );
}
