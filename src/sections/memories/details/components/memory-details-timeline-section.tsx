import type { DashboardMemoryDetails } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { MemoryDetailsMiniCard } from './memory-details-mini-card';

type Props = {
  memory: DashboardMemoryDetails;
  onAddNextMemory?: () => void;
};

const PLUM_CHANNELS = '94 55 80';

export function MemoryDetailsTimelineSection({ memory, onAddNextMemory }: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        position: 'relative',
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
        boxShadow: `0 32px 64px -32px ${varAlpha(PLUM_CHANNELS, 0.2)}`,
      }}
    >
      {/* --- HEADER (Now consistent with Related Section) --- */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 4 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: 1.5,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.1),
            color: 'primary.main',
            flexShrink: 0,
          }}
        >
          <Iconify icon="solar:route-bold-duotone" width={24} />
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            Putovanje naše priče
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Jedan korak pre, ovaj prelepi trenutak i ono što nas čeka.
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: 'grid',
          gap: { xs: 3, md: 2 },
          gridTemplateColumns: { xs: '1fr', md: 'repeat(3, minmax(0, 1fr))' },
          position: 'relative',
        }}
      >
        {/* --- THE TIMELINE THREAD --- */}
        <Box
          sx={{
            position: 'absolute',
            zIndex: 0,
            bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.15),
            // Mobile: Vertical line (moved left to align with card badges)
            top: 40,
            bottom: 40,
            left: 28,
            width: 2,
            display: { xs: 'block', md: 'none' },
            // Desktop: Horizontal line
            md: {
              top: '50%',
              left: 40,
              right: 40,
              height: 2,
              width: 'auto',
              display: 'block',
              transform: 'translateY(-50%)',
            },
          }}
        />

        <MemoryDetailsMiniCard
          item={memory.previousMemory}
          label="Ranije"
          icon="solar:rewind-back-bold"
          hideWhenEmpty
        />

        <MemoryDetailsMiniCard item={memory} label="Sada" active icon="solar:heart-bold" />

        <MemoryDetailsMiniCard
          item={memory.nextMemory}
          label="Posle"
          icon="solar:rewind-forward-bold"
          onAdd={memory.nextMemory ? undefined : onAddNextMemory}
        />
      </Box>
    </Card>
  );
}
