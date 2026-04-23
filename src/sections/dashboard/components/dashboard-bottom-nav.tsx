import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

// --- Color Channels ---
const ROSE_CHANNELS = '198 91 124';
const PLUM_CHANNELS = '94 55 80';

type Props = {
  currentPath?: string;
  onHome: () => void;
  onTimeline: () => void; // Novo
  onAdd: () => void;
  onMap: () => void; // Novo
  onAddNote: () => void;
};

export function DashboardBottomNav({
  currentPath,
  onHome,
  onTimeline,
  onAdd,
  onMap,
  onAddNote,
}: Props) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar + 2,
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'center',
        px: 2,
        pb: `calc(env(safe-area-inset-bottom) + ${theme.spacing(2)})`,
        pointerEvents: 'none',
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: 1,
          maxWidth: 400,
          height: 64,
          borderRadius: 999,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          px: 1,
          border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
          bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.8),
          backdropFilter: 'blur(20px)',
          boxShadow: `0 24px 48px -12px ${varAlpha(PLUM_CHANNELS, 0.3)}`,
        }}
      >
        {/* Početna */}
        <NavButton
          icon="solar:home-smile-bold-duotone"
          label="Home"
          onClick={onHome}
          active={currentPath === '/dashboard'}
        />

        {/* Timeline */}
        <NavButton
          icon="solar:history-bold-duotone"
          label="Timeline"
          onClick={onTimeline}
          active={currentPath === '/dashboard/timeline'}
        />

        {/* Centralno "DODAJ" Dugme */}
        <ButtonBase
          onClick={onAdd}
          sx={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            color: 'common.white',
            background: `linear-gradient(135deg, rgb(${ROSE_CHANNELS}) 0%, #ff84a4 100%)`,
            boxShadow: `0 8px 16px ${varAlpha(ROSE_CHANNELS, 0.4)}`,
            transition: theme.transitions.create(['transform', 'box-shadow']),
            '&:active': { transform: 'scale(0.9)' },
          }}
        >
          <Iconify icon="solar:add-circle-bold" width={28} />
        </ButtonBase>

        {/* Mapa */}
        <NavButton
          icon="solar:map-point-bold-duotone"
          label="Mapa"
          onClick={onMap}
          active={currentPath === '/dashboard/map'}
        />

        {/* Poruka / Note */}
        <NavButton icon="solar:letter-bold-duotone" label="Poruka" onClick={onAddNote} />
      </Paper>
    </Box>
  );
}

// --- Pomoćna komponenta za dugmiće ---
function NavButton({
  icon,
  label,
  onClick,
  active = false,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  const theme = useTheme();

  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        flexDirection: 'column',
        width: 56,
        height: 56,
        borderRadius: '50%',
        gap: 0.25,
        color: active ? `rgb(${ROSE_CHANNELS})` : 'text.secondary',
        bgcolor: active ? varAlpha(ROSE_CHANNELS, 0.08) : 'transparent',
        transition: theme.transitions.create(['color', 'background-color', 'transform']),
        '&:active': { color: `rgb(${ROSE_CHANNELS})`, transform: 'scale(0.95)' },
      }}
    >
      <Iconify icon={icon} width={24} />
      <Typography
        variant="caption"
        sx={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}
      >
        {label}
      </Typography>
    </ButtonBase>
  );
}
