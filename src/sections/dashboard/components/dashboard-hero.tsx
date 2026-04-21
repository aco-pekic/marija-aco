import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';

import { AvatarWithGlow } from './avatar-with-glow';

type Props = {
  backgroundImage?: string;
};

export function DashboardHero({ backgroundImage = '/assets/background/background-4.jpg' }: Props) {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        height: 250,
        borderRadius: { xs: 0, sm: 3 },
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 8, md: 9 },
        border: {
          xs: 'none',
          sm: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
        },
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'blur(18px) saturate(1.15)',
          transform: 'scale(1.12)',
          opacity: 0.95,
          '&::after': {
            content: '""',
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg,
              ${varAlpha(theme.vars.palette.background.defaultChannel, 0.35)} 0%,
              ${varAlpha(theme.vars.palette.background.defaultChannel, 0.86)} 72%,
              ${theme.vars.palette.background.default} 100%)`,
          },
        })}
      />

      <Box
        aria-hidden
        sx={(theme) => ({
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(circle at 20% 10%, ${varAlpha(
            theme.vars.palette.secondary.mainChannel,
            0.22
          )} 0%, transparent 48%),
            radial-gradient(circle at 80% 0%, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.22)} 0%, transparent 52%),
            radial-gradient(circle at 50% 95%, ${varAlpha(theme.vars.palette.warning.mainChannel, 0.12)} 0%, transparent 50%)`,
        })}
      />

      <Box sx={{ position: 'relative' }}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            alignItems: 'center',
            gap: 2,
            mb: 0,
          }}
        >
          <Box sx={{ display: 'grid', placeItems: 'center' }}>
            <AvatarWithGlow
              name="Marija"
              ring="linear-gradient(135deg, rgba(255,0,214,0.85), rgba(124,58,237,0.85))"
              initialsBg={(theme) =>
                `linear-gradient(135deg, ${theme.vars.palette.secondary.dark}, ${theme.vars.palette.secondary.main})`
              }
            />
          </Box>

          <Box sx={{ display: 'grid', placeItems: 'center' }}>
            <AvatarWithGlow
              name="Aco"
              ring="linear-gradient(135deg, rgba(59,130,246,0.9), rgba(34,211,238,0.85))"
              initialsBg={(theme) =>
                `linear-gradient(135deg, ${theme.vars.palette.primary.dark}, ${theme.vars.palette.primary.main})`
              }
            />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
