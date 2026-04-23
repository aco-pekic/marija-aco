import type { DashboardMemory } from 'src/sections/dashboard/types';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';

import { isSupabaseReady } from 'src/lib/supabase';
import { DashboardContent } from 'src/layouts/dashboard';

import { listDashboardMemories } from 'src/sections/dashboard/supabase';

import { TimelineItem } from '../components/timeline-item';

type TimelineFilter = 'all' | 'year' | '30d';
type GroupedMemories = {
  key: string;
  label: string;
  items: Array<{ memory: DashboardMemory; index: number }>;
};

const PLUM_CHANNELS = '94 55 80';
const ROSE_CHANNELS = '198 91 124';

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return 'Nešto je pošlo po zlu. Pokušaj ponovo.';
}

export function TimelineView() {
  const [filter, setFilter] = useState<TimelineFilter>('all');
  const [memories, setMemories] = useState<DashboardMemory[]>([]);
  const [isLoading, setIsLoading] = useState(isSupabaseReady);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    (async () => {
      setIsLoading(isSupabaseReady);

      try {
        const fetched = await listDashboardMemories('shared');
        if (!active) return;
        setMemories(fetched);
        setError(null);
      } catch (err) {
        if (!active) return;
        setError(getErrorMessage(err));
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const now = dayjs();
    const sorted = [...memories].sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());

    if (filter === 'year') {
      return sorted.filter((item) => dayjs(item.date).year() === now.year());
    }

    if (filter === '30d') {
      const threshold = now.subtract(30, 'day');
      return sorted.filter((item) => dayjs(item.date).isAfter(threshold));
    }

    return sorted;
  }, [filter, memories]);

  const grouped = useMemo<GroupedMemories[]>(() => {
    const groups: GroupedMemories[] = [];
    let runningIndex = 0;

    for (const memory of filtered) {
      const dateValue = dayjs(memory.date);
      const key = dateValue.format('YYYY-MM');
      const label = dateValue.format('MMMM YYYY');
      const last = groups[groups.length - 1];

      if (!last || last.key !== key) {
        groups.push({ key, label, items: [{ memory, index: runningIndex }] });
      } else {
        last.items.push({ memory, index: runningIndex });
      }

      runningIndex += 1;
    }

    return groups;
  }, [filtered]);

  return (
    <DashboardContent maxWidth="xl" sx={{ pb: { xs: 3, md: 5 } }}>
      <Stack spacing={1} sx={{ width: 1, maxWidth: { xs: '100%', md: 920 }, mx: { md: 'auto' } }}>
        <Typography variant="h3" sx={{ fontWeight: 900, letterSpacing: -0.8 }}>
          Scrapbook Timeline
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          Naši mali trenuci, složeni kroz vreme.
        </Typography>
      </Stack>

      <Stack
        direction="row"
        spacing={1}
        useFlexGap
        flexWrap="wrap"
        sx={{ mt: 2.5, width: 1, maxWidth: { xs: '100%', md: 920 }, mx: { md: 'auto' } }}
      >
        <Chip
          label="Sve"
          color={filter === 'all' ? 'primary' : 'default'}
          variant={filter === 'all' ? 'filled' : 'outlined'}
          onClick={() => setFilter('all')}
        />
        <Chip
          label="Ove godine"
          color={filter === 'year' ? 'primary' : 'default'}
          variant={filter === 'year' ? 'filled' : 'outlined'}
          onClick={() => setFilter('year')}
        />
        <Chip
          label="Poslednjih 30 dana"
          color={filter === '30d' ? 'primary' : 'default'}
          variant={filter === '30d' ? 'filled' : 'outlined'}
          onClick={() => setFilter('30d')}
        />
      </Stack>

      {isLoading ? (
        <Stack spacing={1.5} alignItems="center" sx={{ py: 10 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Učitavam timeline...
          </Typography>
        </Stack>
      ) : null}

      {!isLoading && error ? (
        <Alert severity="error" sx={{ mt: 2.5 }}>
          {error}
        </Alert>
      ) : null}

      {!isLoading && !error && filtered.length === 0 ? (
        <Card
          sx={(theme) => ({
            mt: 2.5,
            p: 3,
            borderRadius: 3,
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
            bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.46),
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
          })}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Još nema uspomena za ovaj filter
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: 'text.secondary' }}>
            Dodaj novu uspomenu i pojaviće se ovde.
          </Typography>
        </Card>
      ) : null}

      {!isLoading && !error && filtered.length > 0 ? (
        <Box
          sx={{
            mt: 2.5,
            pb: 1.5,
            pr: { xs: 0, md: 1 },
            width: 1,
            maxWidth: { xs: '100%', md: 920 },
            mx: { md: 'auto' },
          }}
        >
          <Stack spacing={2}>
            {grouped.map((group) => (
              <Box key={group.key}>
                <Box
                  sx={{
                    top: { xs: 4, md: 8 },
                    zIndex: 3,
                    width: 'fit-content',
                    px: 1.2,
                    py: 0.5,
                    mb: 1,
                    borderRadius: 2,
                    position: 'sticky',
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: 0.8,
                    textTransform: 'uppercase',
                    backdropFilter: 'blur(10px)',
                    color: `rgb(${PLUM_CHANNELS})`,
                    bgcolor: varAlpha(ROSE_CHANNELS, 0.2),
                    border: `1px solid ${varAlpha(PLUM_CHANNELS, 0.16)}`,
                  }}
                >
                  {group.label}
                </Box>

                <Stack spacing={2}>
                  {group.items.map(({ memory, index }) => (
                    <TimelineItem
                      key={memory.id}
                      memory={memory}
                      isLast={index === filtered.length - 1}
                    />
                  ))}
                </Stack>
              </Box>
            ))}
          </Stack>
        </Box>
      ) : null}
    </DashboardContent>
  );
}
