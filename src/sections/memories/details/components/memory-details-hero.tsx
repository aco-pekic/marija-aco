import type { DashboardMemoryDetails } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import { useTheme, keyframes } from '@mui/material/styles';
import CircularProgress from '@mui/material/CircularProgress';

import { Iconify } from 'src/components/iconify';

import { formatMemoryDate } from '../utils';

type Props = {
  memory: DashboardMemoryDetails;
  shortPlaceName: string;
  memoryProgressCompactLabel: string;
  isUploadingPhotos: boolean;
  onBack: () => void;
  onUploadPhotos: () => void;
  onEdit: () => void;
};

const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

export function MemoryDetailsHero({
  memory,
  shortPlaceName,
  memoryProgressCompactLabel,
  isUploadingPhotos,
  onBack,
  onUploadPhotos,
  onEdit,
}: Props) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'relative',
        overflow: 'hidden',
        mt: { xs: 1, md: 2 },
        borderRadius: { xs: 4, md: 5 },
        minHeight: { xs: 420, md: 520 }, // Slightly taller for more "Drama"
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        p: { xs: 2.5, md: 4 },
        // Main Background with a softer, double-layered gradient
        backgroundImage: `
          linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.8) 100%),
          url(${memory.imageSrc})
        `,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: `0 40px 80px -20px ${varAlpha(theme.vars.palette.common.blackChannel, 0.5)}`,
      }}
    >
      {/* --- TOP BAR: NAVIGATION & ACTIONS --- */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ zIndex: 10 }}>
        <IconButton
          onClick={onBack}
          sx={{
            bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.4),
            backdropFilter: 'blur(8px)',
            color: 'common.white',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
            '&:hover': { bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.6) },
          }}
        >
          <Iconify icon="solar:alt-arrow-left-outline" width={24} />
        </IconButton>

        <Stack
          direction="row"
          spacing={1}
          sx={{
            p: 0.5,
            borderRadius: '50px',
            bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.4),
            backdropFilter: 'blur(12px)',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
          }}
        >
          <Tooltip title="Dodaj slike">
            <IconButton
              onClick={onUploadPhotos}
              disabled={isUploadingPhotos}
              sx={{
                color: isUploadingPhotos ? 'primary.main' : 'common.white',
                '&:hover': { color: 'primary.light' },
              }}
            >
              {isUploadingPhotos ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <Iconify icon="solar:gallery-add-bold-duotone" width={22} />
              )}
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={onEdit}
            sx={{ color: 'common.white', '&:hover': { color: 'primary.light' } }}
          >
            <Iconify icon="solar:pen-2-bold-duotone" width={22} />
          </IconButton>
        </Stack>
      </Stack>

      {/* --- BOTTOM CONTENT: THE STORY --- */}
      <Box sx={{ position: 'relative', zIndex: 10 }}>
        <Stack spacing={2}>
          {/* Heart Label */}
          <Stack direction="row" alignItems="center" spacing={1}>
            <Box
              sx={{
                px: 1.5,
                py: 0.5,
                borderRadius: '20px',
                bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.2),
                backdropFilter: 'blur(10px)',
                border: `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.3)}`,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
              }}
            >
              <Iconify
                icon="solar:heart-bold"
                width={14}
                sx={{ color: '#FF4C61', animation: `${pulse} 2s infinite ease-in-out` }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'common.white',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                {memoryProgressCompactLabel}
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Typography
              variant="h2"
              sx={{
                color: 'common.white',
                fontWeight: 900,
                lineHeight: 1.1,
                fontSize: { xs: '2rem', md: '3.5rem' },
                textShadow: '0 4px 12px rgba(0,0,0,0.4)',
              }}
            >
              {memory.title ?? shortPlaceName ?? 'Mali trenutak zauvek'}
            </Typography>

            <Stack direction="row" spacing={2} sx={{ mt: 1.5, opacity: 0.9 }}>
              <DetailItem icon="solar:map-point-bold-duotone" label={shortPlaceName} />
              <DetailItem
                icon="solar:calendar-date-bold-duotone"
                label={formatMemoryDate(memory.date)}
              />
            </Stack>
          </Box>

          {memory.description && (
            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.8)',
                maxWidth: 600,
                fontSize: { xs: '0.9rem', md: '1.1rem' },
                lineHeight: 1.6,
                fontWeight: 400,
                display: '-webkit-box',
                overflow: 'hidden',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {memory.description}
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

// --- Helper Component for the Date/Location items ---
function DetailItem({ icon, label }: { icon: string; label: string }) {
  return (
    <Stack direction="row" alignItems="center" spacing={0.5}>
      <Iconify icon={icon} width={16} sx={{ color: 'primary.light' }} />
      <Typography
        variant="caption"
        sx={{ color: 'common.white', fontWeight: 600, fontSize: { xs: 11, md: 13 } }}
      >
        {label}
      </Typography>
    </Stack>
  );
}
