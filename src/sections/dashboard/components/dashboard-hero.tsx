import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';

import { AvatarWithGlow } from './avatar-with-glow';

type Props = {
  backgroundImage?: string;
  marijaAvatarSrc?: string;
  acoAvatarSrc?: string;
  onOpenHero: () => void;
  onOpenAvatar: (person: 'marija' | 'aco') => void;
};

export function DashboardHero({
  backgroundImage = '/assets/background/background-4.jpg',
  marijaAvatarSrc,
  acoAvatarSrc,
  onOpenHero,
  onOpenAvatar,
}: Props) {
  return (
    <Box
      onClick={onOpenHero}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpenHero();
        }
      }}
      role="button"
      tabIndex={0}
      sx={(theme) => ({
        position: 'relative',
        overflow: 'hidden',
        height: 250,
        cursor: 'pointer',
        borderRadius: { xs: 0, sm: 3 },
        px: { xs: 2, sm: 3, md: 4 },
        pt: { xs: 3, md: 4 },
        pb: { xs: 8, md: 9 },
        outline: 'none',
        border: {
          xs: 'none',
          sm: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
        },
        '&:focus-visible': {
          boxShadow: `0 0 0 2px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.52)}`,
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
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 1 }}>
          <IconButton
            size="small"
            onClick={(event) => {
              event.stopPropagation();
              onOpenHero();
            }}
            sx={(theme) => ({
              color: theme.vars.palette.common.white,
              bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.24),
              backdropFilter: 'blur(8px)',
              '&:hover': { bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.36) },
            })}
          >
            <Typography variant="caption" sx={{ fontWeight: 700, px: 0.5 }}>
              View
            </Typography>
          </IconButton>
        </Stack>

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
            <Box
              onClick={(event) => {
                event.stopPropagation();
                onOpenAvatar('marija');
              }}
              sx={{ borderRadius: '50%', cursor: 'pointer' }}
            >
              <AvatarWithGlow
                name="Marija"
                src={marijaAvatarSrc}
                ring="linear-gradient(135deg, rgba(255,0,214,0.85), rgba(124,58,237,0.85))"
                initialsBg={(theme) =>
                  `linear-gradient(135deg, ${theme.vars.palette.secondary.dark}, ${theme.vars.palette.secondary.main})`
                }
              />
            </Box>
          </Box>

          <Box sx={{ display: 'grid', placeItems: 'center' }}>
            <Box
              onClick={(event) => {
                event.stopPropagation();
                onOpenAvatar('aco');
              }}
              sx={{ borderRadius: '50%', cursor: 'pointer' }}
            >
              <AvatarWithGlow
                name="Aco"
                src={acoAvatarSrc}
                ring="linear-gradient(135deg, rgba(59,130,246,0.9), rgba(34,211,238,0.85))"
                initialsBg={(theme) =>
                  `linear-gradient(135deg, ${theme.vars.palette.primary.dark}, ${theme.vars.palette.primary.main})`
                }
              />
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
