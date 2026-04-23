import type { DashboardLocation } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import { MemoryOsmMap } from '../../components/memory-osm-map';

type Props = {
  location: DashboardLocation;
};

const PLUM_CHANNELS = '94 55 80';

export function MemoryDetailsLocationCard({ location }: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: 1.5, // Tighter padding for a sleek look
        borderRadius: 4,
        position: 'relative',
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
        boxShadow: `0 32px 64px -32px ${varAlpha(PLUM_CHANNELS, 0.2)}`,
      }}
    >
      <Box sx={{ position: 'relative', height: 300, borderRadius: 3, overflow: 'hidden' }}>
        <MemoryOsmMap
          address={location.name}
          coordinates={{
            type: 'Point',
            coordinates: [location.coordinates[1], location.coordinates[0]],
          }}
          height="100%"
        />

        {/* Floating Location Pill */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            right: 16,
            zIndex: 1000, // Above leaflet
            p: 1.5,
            borderRadius: 2,
            bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.8),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
            boxShadow: theme.customShadows?.z16,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                width: 36,
                height: 36,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.1),
                color: 'primary.main',
              }}
            >
              <Iconify icon="solar:map-point-wave-bold-duotone" width={22} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle2"
                noWrap
                sx={{ color: 'text.primary', fontWeight: 800 }}
              >
                {location.name}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                Lokacija naše uspomene
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Card>
  );
}
