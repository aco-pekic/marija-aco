import type { Dayjs } from 'dayjs';

import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

type Props = {
  date: string | Date | Dayjs;
};

const PLUM_CHANNELS = '94 55 80';
const ROSE_CHANNELS = '198 91 124';

export function TimelineCalendarCard({ date }: Props) {
  const theme = useTheme();
  const value = dayjs(date);

  return (
    <Box
      sx={{
        width: { xs: 56, sm: 72 },
        borderRadius: { xs: 2.5, sm: 3 },
        overflow: 'hidden',
        backdropFilter: 'blur(10px)',
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.62),
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
        boxShadow: `0 18px 36px -24px ${varAlpha(PLUM_CHANNELS, 0.9)}`,
      }}
    >
      <Box
        sx={{
          py: { xs: 0.6, sm: 0.75 },
          px: { xs: 0.6, sm: 1 },
          textAlign: 'center',
          bgcolor: varAlpha(ROSE_CHANNELS, 0.32),
          borderBottom: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
        }}
      >
        <Typography
          variant="caption"
          sx={{ fontWeight: 900, fontSize: { xs: 10, sm: 11 }, letterSpacing: 1.1 }}
        >
          {value.format('MMM').toUpperCase()}
        </Typography>
      </Box>

      <Box sx={{ py: { xs: 1.1, sm: 1.25 }, px: { xs: 0.6, sm: 1 }, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ lineHeight: 1, fontWeight: 900, fontSize: { xs: 36, sm: 40 } }}>
          {value.format('DD')}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            mt: 0.35,
            display: 'block',
            color: 'text.secondary',
            fontWeight: 700,
            fontSize: { xs: 12, sm: 13 },
          }}
        >
          {value.format('YYYY')}
        </Typography>
      </Box>
    </Box>
  );
}
