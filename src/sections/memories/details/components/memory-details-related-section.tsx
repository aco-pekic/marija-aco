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
};

const PLUM_CHANNELS = '94 55 80';

export function MemoryDetailsRelatedSection({ memory }: Props) {
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
      {/* --- HEADER --- */}
      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 3.5 }}>
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
          <Iconify icon="solar:folder-favourite-star-bold-duotone" width={24} />
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.5 }}>
            Poglavlje: {memory.location.name.split(',')[0]}
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Svi naši trenuci sa ovog istog mesta, spakovani zajedno.
          </Typography>
        </Box>
      </Stack>

      {/* --- CONTENT --- */}
      {memory.relatedMemories.length > 0 ? (
        <Box
          sx={{
            display: 'grid',
            gap: 2,
            gridTemplateColumns: {
              xs: '1fr',
              sm: 'repeat(2, minmax(0, 1fr))',
              lg: 'repeat(3, minmax(0, 1fr))',
            },
          }}
        >
          {memory.relatedMemories.map((item) => (
            <MemoryDetailsMiniCard
              key={item.id}
              item={item}
              label="Takođe ovde"
              icon="solar:map-point-bold-duotone"
            />
          ))}
        </Box>
      ) : (
        /* --- CUTE EMPTY STATE --- */
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{
            py: 6,
            px: 2,
            borderRadius: 3,
            border: `2px dashed ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
            bgcolor: varAlpha(theme.vars.palette.background.neutralChannel, 0.4),
            textAlign: 'center',
          }}
        >
          <Box
            sx={{
              mb: 2,
              width: 56,
              height: 56,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.08),
            }}
          >
            <Iconify icon="solar:stars-bold-duotone" width={32} sx={{ color: 'primary.main' }} />
          </Box>

          <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
            Početak nove priče
          </Typography>

          <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 280, mt: 0.5 }}>
            Ovo je vaša prva zajednička uspomena na ovoj lokaciji. Jedva čekamo sledeću!
          </Typography>
        </Stack>
      )}
    </Card>
  );
}
