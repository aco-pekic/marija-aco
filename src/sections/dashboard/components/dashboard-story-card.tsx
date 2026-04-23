import dayjs from 'dayjs';
import { varAlpha } from 'minimal-shared/utils';
import { useMemo, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import { keyframes } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import {
  RELATIONSHIP_START,
  formatRelationshipDate,
  getLiveRelationshipCounterParts,
} from '../relationship';

function formatCounterValue(value: number) {
  return value.toLocaleString();
}

type TimeBlockProps = {
  value: string | number;
  label: string;
  showDivider?: boolean;
};

const heartPulse = keyframes`
  0% {
    transform: scale(1);
    opacity: 0.95;
  }
  50% {
    transform: scale(1.14);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 0.95;
  }
`;

const heartHalo = keyframes`
  0% {
    transform: scale(0.8);
    opacity: 0.34;
  }
  70% {
    transform: scale(1.9);
    opacity: 0;
  }
  100% {
    transform: scale(1.9);
    opacity: 0;
  }
`;

const heartHaloSoft = keyframes`
  0% {
    transform: scale(0.9);
    opacity: 0.2;
  }
  70% {
    transform: scale(2.35);
    opacity: 0;
  }
  100% {
    transform: scale(2.35);
    opacity: 0;
  }
`;

function TimeBlock({ value, label, showDivider = false }: TimeBlockProps) {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        minWidth: { xs: 54, sm: 60 },
        px: { xs: 1.1, sm: 1.4 },
        py: 0.75,
        textAlign: 'center',
        ...(showDivider && {
          '&::before': {
            content: '""',
            position: 'absolute',
            left: 0,
            top: '18%',
            bottom: '18%',
            width: '1px',
            background: `linear-gradient(
              to bottom,
              transparent,
              ${varAlpha(theme.vars.palette.common.whiteChannel, 0.14)},
              transparent
            )`,
          },
        }),
      })}
    >
      <Typography
        sx={{
          fontSize: { xs: 22, sm: 26 },
          lineHeight: 1,
          fontWeight: 800,
          letterSpacing: -0.4,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </Typography>

      <Typography
        variant="caption"
        sx={(theme) => ({
          mt: 0.35,
          display: 'block',
          color: theme.vars.palette.text.secondary,
          textTransform: 'uppercase',
          letterSpacing: 1.1,
          fontSize: 10,
        })}
      >
        {label}
      </Typography>
    </Box>
  );
}

export function DashboardStoryCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [now, setNow] = useState(() => dayjs());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(dayjs());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  const counter = useMemo(() => getLiveRelationshipCounterParts(now), [now]);

  const handleFlip = () => {
    setIsFlipped((current) => !current);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 2,
        perspective: 1400,
        willChange: 'transform',
      }}
    >
      <Box
        role="button"
        tabIndex={0}
        onClick={handleFlip}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleFlip();
          }
        }}
        sx={{
          width: '100%',
          maxWidth: { xs: 288, sm: 320, md: 360 },
          height: 148,
          position: 'relative',
          cursor: 'pointer',
          transformStyle: 'preserve-3d',
          transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          willChange: 'transform',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          '&:focus-visible': {
            outline: '2px solid rgba(255,255,255,0.45)',
            outlineOffset: 6,
            borderRadius: 20,
          },
        }}
      >
        <Card
          sx={(theme) => ({
            width: '100%',
            height: '100%',
            borderRadius: 2.5,
            overflow: 'hidden',
            position: 'absolute',
            inset: 0,
            textAlign: 'center',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 18px 40px -26px ${varAlpha(theme.vars.palette.common.blackChannel, 0.9)}`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(0deg) translateZ(0)',
            willChange: 'transform',
            background: `
              radial-gradient(circle at top right, rgba(255, 152, 176, 0.24), transparent 28%),
              radial-gradient(circle at bottom left, rgba(255, 215, 222, 0.18), transparent 32%),
              radial-gradient(circle at 50% 120%, rgba(255, 194, 204, 0.12), transparent 36%),
              ${varAlpha(theme.vars.palette.background.paperChannel, 0.84)}
            `,
          })}
        >
          <Tooltip title="Okreni karticu" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              sx={(theme) => ({
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 3,
                width: 28,
                height: 28,
                border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
                bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.5),
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.72),
                },
              })}
            >
              <Iconify icon="solar:restart-bold-duotone" width={15} />
            </IconButton>
          </Tooltip>

          <Box
            sx={{
              position: 'absolute',
              top: 13,
              right: 13,
              width: 20,
              height: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(255, 122, 146, 0.32)',
                animation: `${heartHalo} 1.8s ease-out infinite`,
              }}
            />

            <Box
              sx={{
                position: 'absolute',
                inset: -3,
                borderRadius: '50%',
                background: 'rgba(255, 122, 146, 0.18)',
                filter: 'blur(4px)',
                animation: `${heartHaloSoft} 1.8s ease-out infinite`,
              }}
            />

            <Box
              sx={{
                position: 'relative',
                zIndex: 1,
                width: 18,
                height: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(255, 145, 165, 0.22) 0%, rgba(255, 145, 165, 0.08) 60%, transparent 100%)',
                animation: `${heartPulse} 1.4s ease-in-out infinite`,
              }}
            >
              <Iconify
                icon="solar:heart-bold"
                width={14}
                sx={{
                  color: '#ff7a92',
                  filter: 'drop-shadow(0 0 8px rgba(255, 122, 146, 0.45))',
                }}
              />
            </Box>
          </Box>

          <Stack
            spacing={0.8}
            alignItems="center"
            justifyContent="center"
            sx={{ px: 2.25, py: 2.2, height: '100%' }}
          >
            <Typography
              variant="overline"
              sx={{
                letterSpacing: 2.2,
                opacity: 0.88,
                lineHeight: 1,
              }}
            >
              Marija &amp; Aco
            </Typography>

            <Typography
              sx={{
                fontSize: { xs: 26, sm: 30 },
                lineHeight: 1.04,
                fontWeight: 800,
                letterSpacing: 1,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {formatRelationshipDate()}
            </Typography>

            <Typography
              variant="body2"
              sx={(theme) => ({
                color: theme.vars.palette.text.secondary,
                maxWidth: 220,
                mx: 'auto',
              })}
            >
              Dan kada je naša priča počela
            </Typography>
          </Stack>
        </Card>

        <Card
          sx={(theme) => ({
            width: '100%',
            height: '100%',
            borderRadius: 2.5,
            overflow: 'hidden',
            position: 'absolute',
            inset: 0,
            textAlign: 'center',
            border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            boxShadow: `0 18px 40px -26px ${varAlpha(theme.vars.palette.common.blackChannel, 0.9)}`,
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg) translateZ(0)',
            willChange: 'transform',
            background: `
              radial-gradient(circle at top right, rgba(255, 185, 195, 0.24), transparent 28%),
              radial-gradient(circle at bottom left, rgba(255, 221, 181, 0.18), transparent 30%),
              ${varAlpha(theme.vars.palette.background.paperChannel, 0.84)}
            `,
          })}
        >
          <Tooltip title="Vrati karticu" arrow placement="top">
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleFlip();
              }}
              sx={(theme) => ({
                position: 'absolute',
                top: 10,
                left: 10,
                zIndex: 3,
                width: 28,
                height: 28,
                border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
                bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.5),
                backdropFilter: 'blur(8px)',
                '&:hover': {
                  bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.72),
                },
              })}
            >
              <Iconify icon="solar:restart-bold-duotone" width={15} />
            </IconButton>
          </Tooltip>

          <Stack spacing={1.15} justifyContent="center" sx={{ px: 1.4, py: 1.8, height: '100%' }}>
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: 0.3,
              }}
            >
              Rastemo svake sekunde
            </Typography>

            <Stack
              direction="row"
              alignItems="stretch"
              justifyContent="center"
              sx={{
                mx: 'auto',
                borderRadius: 2,
                overflow: 'hidden',
                border: (theme) =>
                  `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
                bgcolor: (theme) => varAlpha(theme.vars.palette.common.whiteChannel, 0.03),
              }}
            >
              <TimeBlock value={formatCounterValue(counter.totalDays)} label="Dana" />
              <TimeBlock value={String(counter.hours).padStart(2, '0')} label="Sati" showDivider />
              <TimeBlock value={String(counter.minutes).padStart(2, '0')} label="Min" showDivider />
              <TimeBlock value={String(counter.seconds).padStart(2, '0')} label="Sek" showDivider />
            </Stack>

            <Typography
              variant="caption"
              sx={(theme) => ({
                color: theme.vars.palette.text.secondary,
                letterSpacing: 0.4,
              })}
            >
              Od {RELATIONSHIP_START.format('DD MMM YYYY')}
            </Typography>
          </Stack>
        </Card>
      </Box>
    </Box>
  );
}
