import type { DashboardMemory } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';

import { paths } from 'src/routes/paths';
import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';

import { formatMemoryDate, getTimelineLabel, getPrimaryPlaceName } from '../utils';

type Props = {
  item: DashboardMemory | null;
  label: string;
  icon: string;
  active?: boolean;
  hideWhenEmpty?: boolean;
  onAdd?: () => void;
};

export function MemoryDetailsMiniCard({ item, label, icon, active, hideWhenEmpty, onAdd }: Props) {
  const theme = useTheme();
  const router = useRouter();

  const handleNavigate = () => {
    if (item && !active) {
      router.push(paths.dashboard.memoryDetails(item.id), { state: { memory: item } });
    }
  };

  const commonStyles = {
    minHeight: 140,
    borderRadius: 3,
    p: 2,
    zIndex: 1,
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    transition: theme.transitions.create(['transform', 'box-shadow', 'border-color']),
  };

  if (!item) {
    if (hideWhenEmpty) return null;

    return (
      <Card
        sx={{
          ...commonStyles,
          border: `2px dashed ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
          bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.2),
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <Iconify
          icon="solar:magic-stick-3-bold-duotone"
          width={24}
          sx={{ color: 'text.disabled', mb: 1, opacity: 0.5 }}
        />
        <Typography
          variant="caption"
          sx={{ color: 'text.disabled', fontWeight: 800, textTransform: 'uppercase' }}
        >
          {label}
        </Typography>
        <Typography variant="caption" sx={{ color: 'text.disabled', mt: 0.5, px: 2 }}>
          Nova uspomena čeka...
        </Typography>
        {onAdd ? (
          <Button
            onClick={onAdd}
            variant="contained"
            size="small"
            startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
            sx={{ mt: 1.75, borderRadius: 999, textTransform: 'none' }}
          >
            Dodaj uspomenu
          </Button>
        ) : null}
      </Card>
    );
  }

  return (
    <Card
      onClick={handleNavigate}
      sx={{
        ...commonStyles,
        cursor: active ? 'default' : 'pointer',
        border: active
          ? `2px solid ${theme.palette.primary.main}`
          : `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
        backgroundImage: `linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.8) 100%), url(${item.imageSrc})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        boxShadow: active
          ? `0 0 20px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.3)}`
          : 'none',
        ...(active
          ? {}
          : {
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: theme.customShadows?.z24,
              },
            }),
      }}
    >
      {/* Label Badge */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={0.5}
        sx={{
          position: 'absolute',
          top: 12,
          left: 12,
          px: 1,
          py: 0.5,
          borderRadius: 1,
          bgcolor: active ? 'primary.main' : 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(4px)',
          color: 'white',
        }}
      >
        <Iconify icon={icon} width={12} />
        <Typography
          variant="caption"
          sx={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 9 }}
        >
          {label}
        </Typography>
      </Stack>

      <Box>
        <Typography variant="subtitle2" noWrap sx={{ color: 'common.white', fontWeight: 800 }}>
          {getTimelineLabel(item)}
        </Typography>
        <Typography variant="caption" noWrap sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
          {formatMemoryDate(item.date)} • {getPrimaryPlaceName(item.location.name)}
        </Typography>
      </Box>
    </Card>
  );
}
