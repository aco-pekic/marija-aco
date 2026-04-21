import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function DashboardStoryCard() {
  return (
    <Box
      sx={{
        px: { xs: 2, sm: 0 },
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        mt: { xs: -7, sm: -6, md: -7 },
        mb: { xs: -7, sm: -6, md: -7 },
      }}
    >
      <Card
        sx={(theme) => ({
          width: '100%',
          maxWidth: { xs: 300, md: 400 },
          textAlign: 'center',
          borderRadius: 2.5,
          overflow: 'hidden',
          position: 'relative',
          border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
          backdropFilter: 'blur(14px)',
          boxShadow: `0 26px 68px -34px ${varAlpha(theme.vars.palette.common.blackChannel, 0.85)}`,
        })}
      >
        <Stack spacing={0.5} alignItems="center" sx={{ position: 'relative', py: 2, px: 2.5 }}>
          <Typography variant="overline" sx={{ letterSpacing: 2 }}>
            Marija &amp; Aco
          </Typography>

          <Typography
            variant="h4"
            sx={{
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: 2,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            15 . 10 . 2022
          </Typography>

          <Typography
            variant="body2"
            sx={(theme) => ({ color: theme.vars.palette.text.secondary })}
          >
            The day our story began
          </Typography>
        </Stack>
      </Card>
    </Box>
  );
}
