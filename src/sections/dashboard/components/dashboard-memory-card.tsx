import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import type { DashboardMemory } from '../types';

type Props = {
  memory: DashboardMemory;
  variant?: 'compact' | 'timeline';
  pulseHeart?: boolean;
};

function getPrimaryPlaceName(name: string) {
  return name.split(',')[0]?.trim() || name;
}

export function DashboardMemoryCard({ memory, variant = 'compact', pulseHeart = false }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const isTimeline = variant === 'timeline';

  const cardSize = isTimeline
    ? {
        width: '100%',
        height: { xs: 320, sm: 420, md: 470 },
      }
    : {
        width: 220,
        height: 280,
      };

  return (
    <Card
      sx={{
        width: cardSize.width,
        height: cardSize.height,
        borderRadius: isTimeline ? 4 : 3,
        flexShrink: 0,
        position: 'relative',
        scrollSnapAlign: 'start',
        overflow: 'hidden',
        boxShadow: `0 12px 32px -12px ${varAlpha(theme.vars.palette.common.blackChannel, 0.3)}`,
        transition: theme.transitions.create(['transform', 'box-shadow']),
        '&:hover': {
          transform: isTimeline ? 'translateY(-2px)' : 'scale(1.02)',
          boxShadow: `0 20px 40px -20px ${varAlpha(theme.vars.palette.common.blackChannel, 0.45)}`,
        },
      }}
    >
      <CardActionArea
        onClick={() => router.push(paths.dashboard.memoryDetails(memory.id), { state: { memory } })}
        sx={{ height: 1 }}
      >
        {/* --- HERO IMAGE (Fills entire background) --- */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${memory.imageSrc})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            transition: theme.transitions.create('transform', { duration: 1000 }),
          }}
        />

        {/* --- TOP GRADIENT OVERLAY (For the heart) --- */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 60,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 100%)',
          }}
        />

        {/* --- FLOATING CUTE ICON --- */}
        <Box
          sx={{
            position: 'absolute',
            top: 12,
            left: 12,
            color: 'common.white',
            filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.4))',
          }}
        >
          <Iconify
            icon="solar:heart-bold"
            width={isTimeline ? 32 : 20}
            sx={{
              color: '#FF4C61',
              animation: pulseHeart ? 'heartPulse 1.8s ease-in-out infinite' : undefined,
              '@keyframes heartPulse': {
                '0%, 100%': { transform: 'scale(1)' },
                '50%': { transform: 'scale(1.12)' },
              },
            }}
          />
        </Box>

        {/* --- DATE BADGE (Floating) --- */}
        <Typography
          variant="caption"
          sx={{
            position: 'absolute',
            top: 12,
            right: 12,
            px: isTimeline ? 1.3 : 1,
            py: isTimeline ? 0.45 : 0.25,
            borderRadius: isTimeline ? 4 : 1,
            fontWeight: 800,
            fontSize: isTimeline ? 13 : 10,
            whiteSpace: 'nowrap',
            color: 'common.white',
            bgcolor: varAlpha(theme.vars.palette.common.blackChannel, 0.3),
            backdropFilter: 'blur(8px)',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.2)}`,
          }}
        >
          {memory.date}
        </Typography>

        {/* --- BOTTOM GLASS CONTENT (The "Nice to Have") --- */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: isTimeline ? 2.2 : 1.5,
            pt: isTimeline ? 4.5 : 3,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 60%, transparent 100%)',
          }}
        >
          <Stack spacing={0.25}>
            <Typography
              variant={isTimeline ? 'h5' : 'subtitle2'}
              sx={{
                color: 'common.white',
                fontWeight: 800,
                textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                overflow: 'hidden',
                display: '-webkit-box',
                WebkitLineClamp: isTimeline ? 2 : 1,
                WebkitBoxOrient: 'vertical',
              }}
            >
              {memory.title ?? 'Uspomena'}
            </Typography>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <Iconify
                icon="solar:map-point-bold-duotone"
                width={isTimeline ? 16 : 12}
                sx={{ color: 'primary.light' }}
              />
              <Typography
                variant="caption"
                noWrap={!isTimeline}
                sx={{
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                  fontSize: isTimeline ? 14 : 10,
                }}
              >
                {getPrimaryPlaceName(memory.location.name)}
              </Typography>
            </Stack>

            {/* Description only takes 1 line to save space for the image */}
            {memory.description && (
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255,255,255,0.6)',
                  fontStyle: 'italic',
                  fontSize: isTimeline ? 13 : 10,
                  mt: 0.5,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: isTimeline ? 'normal' : 'nowrap',
                  display: '-webkit-box',
                  WebkitLineClamp: isTimeline ? 2 : 1,
                  WebkitBoxOrient: 'vertical',
                }}
              >
                {memory.description}
              </Typography>
            )}
          </Stack>
        </Box>
      </CardActionArea>
    </Card>
  );
}
