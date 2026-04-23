import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { VibeCard } from './vibe-card';
import { DashboardLoveQuote } from './dashboard-love-quote';

import type { Vibe, DashboardPerson } from '../types';

type Props = {
  authenticated: boolean;
  marija: Vibe;
  aco: Vibe;
  currentPerson: DashboardPerson;
  onOpenNote?: () => void;
};

export function DashboardVibes({
  authenticated,
  marija,
  aco,
  currentPerson,
  onOpenNote,
}: Props) {
  const hasNotes = !!marija.text.trim() || !!aco.text.trim();

  return (
    <Box>
      <Stack spacing={0.75} sx={{ mb: 1.5 }}>
        <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
          <Typography variant="h6">Današnja poruka</Typography>
          <Typography
            variant="caption"
            sx={(theme) => ({
              color: theme.vars.palette.text.secondary,
              fontWeight: 700,
              letterSpacing: 0.2,
            })}
          >
            Resetuje se svaki dan
          </Typography>
        </Stack>
        {hasNotes ? (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <Typography
              variant="body2"
              sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
            >
              Male poruke za danas
            </Typography>
            {onOpenNote ? (
              <Button size="small" variant="contained" onClick={onOpenNote}>
                {currentPerson === 'marija'
                  ? 'Izmeni moju poruku (Marija)'
                  : 'Izmeni moju poruku (Aco)'}
              </Button>
            ) : null}
          </Stack>
        ) : (
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
            sx={{ flexWrap: 'wrap' }}
          >
            <Typography
              variant="body2"
              sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
            >
              Još nema poruka
            </Typography>
            {onOpenNote ? (
              <Button size="small" variant="contained" onClick={onOpenNote}>
                {currentPerson === 'marija' ? 'Dodaj moju poruku (Marija)' : 'Dodaj moju poruku (Aco)'}
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
          <VibeCard title="Marija" value={marija} editable={false} />
          <VibeCard title="Aco" value={aco} editable={false} />
        </Box>
      ) : null}

      <DashboardLoveQuote enabled={authenticated} />
    </Box>
  );
}
