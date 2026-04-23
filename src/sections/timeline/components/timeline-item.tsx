import type { DashboardMemory } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';

import { DashboardMemoryCard } from 'src/sections/dashboard/components/dashboard-memory-card';

import { TimelineCalendarCard } from './timeline-calendar-card';

type Props = {
  memory: DashboardMemory;
  isLast?: boolean;
};

const PLUM_CHANNELS = '94 55 80';

export function TimelineItem({ memory, isLast = false }: Props) {
  const theme = useTheme();

  return (
    <Stack
      direction="row"
      spacing={{ xs: 1.5, sm: 2.5 }}
      sx={{ width: 1, minHeight: { xs: 320, sm: 420 } }}
    >
      <Box
        sx={{
          width: { xs: 56, sm: 72 },
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
        }}
      >
        <TimelineCalendarCard date={memory.date} />
        {!isLast && (
          <Box
            sx={{
              mt: 1,
              flexGrow: 1,
              width: 0,
              minHeight: 20,
              borderLeft: `1px dashed ${varAlpha(PLUM_CHANNELS, 0.38)}`,
              opacity: 0.7,
            }}
          />
        )}
      </Box>

      <Box
        sx={{
          minWidth: 0,
          flex: '1 1 auto',
          display: 'flex',
          alignItems: 'flex-start',
          '& .MuiCard-root': {
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
          },
        }}
      >
        <DashboardMemoryCard memory={memory} variant="timeline" pulseHeart />
      </Box>
    </Stack>
  );
}
