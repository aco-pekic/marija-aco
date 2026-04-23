import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

type Props = {
  sharedNote?: string;
  updatedAt?: string;
  onEdit: () => void;
};

// --- RGB Channels for your varAlpha utility ---
const PLUM_CHANNELS = '94 55 80'; // #5E3750
const ROSE_CHANNELS = '198 91 124'; // #C65B7C

export function MemoryDetailsSharedNoteCard({ sharedNote, updatedAt, onEdit }: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 3 },
        borderRadius: 4,
        position: 'relative',
        overflow: 'hidden',
        bgcolor: '#FFFDFB',
        // Fixed: Using primary.mainChannel for the border
        border: `1px solid ${varAlpha(theme.vars.palette.primary.mainChannel, 0.1)}`,
        // Fixed: Using RGB channels for shadow
        boxShadow: `0 20px 40px -20px ${varAlpha(PLUM_CHANNELS, 0.15)}`,
        '&::after': {
          content: '""',
          position: 'absolute',
          inset: 0,
          opacity: 0.03,
          backgroundImage: `linear-gradient(#5E3750 1px, transparent 1px)`, // Hex is fine in raw CSS strings
          backgroundSize: '100% 28px',
          pointerEvents: 'none',
        },
      }}
    >
      {/* Decorative "Pin" */}
      <Box
        sx={{
          position: 'absolute',
          top: -10,
          right: 20,
          width: 40,
          height: 40,
          bgcolor: '#FF4C61',
          borderRadius: '0 0 12px 12px',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
          pb: 1,
          boxShadow: '0 4px 10px rgba(255, 76, 97, 0.3)',
          zIndex: 2,
        }}
      >
        <Iconify icon="solar:heart-bold" width={18} sx={{ color: 'white' }} />
      </Box>

      <Stack spacing={2.5} sx={{ position: 'relative', zIndex: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Iconify icon="solar:notes-bold-duotone" width={24} sx={{ color: '#C65B7C' }} />
          <Typography
            variant="subtitle2"
            sx={{
              color: '#5E3750',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Naša beleška
          </Typography>
        </Stack>

        <Box sx={{ minHeight: 60 }}>
          <Typography
            variant="body1"
            sx={{
              color: '#5E3750',
              lineHeight: 1.7,
              fontStyle: sharedNote ? 'normal' : 'italic',
              fontWeight: 500,
              fontSize: { xs: '0.95rem', md: '1.05rem' },
              opacity: sharedNote ? 1 : 0.6,
            }}
          >
            {sharedNote ?? 'Napišite nešto što samo vas dvoje razumete...'}
          </Typography>
        </Box>

        {/* Fixed: Using PLUM_CHANNELS in varAlpha */}
        <Divider sx={{ borderStyle: 'dashed', borderColor: varAlpha(PLUM_CHANNELS, 0.1) }} />

        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={0.5} alignItems="center" sx={{ opacity: 0.6 }}>
            <Iconify icon="solar:clock-circle-outline" width={14} sx={{ color: '#5E3750' }} />
            <Typography variant="caption" sx={{ color: '#5E3750', fontWeight: 600 }}>
              {updatedAt
                ? `Ažurirano ${dayjs(updatedAt).format('DD.MM.YYYY.')}`
                : 'Samo za vaše oči'}
            </Typography>
          </Stack>

          <Button
            size="small"
            onClick={onEdit}
            startIcon={<Iconify icon="solar:pen-new-square-bold-duotone" width={16} />}
            sx={{
              borderRadius: 2,
              color: '#C65B7C',
              // Fixed: Using ROSE_CHANNELS in varAlpha
              bgcolor: varAlpha(ROSE_CHANNELS, 0.08),
              fontWeight: 700,
              px: 1.5,
              '&:hover': { bgcolor: varAlpha(ROSE_CHANNELS, 0.12) },
            }}
          >
            Izmeni
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}
