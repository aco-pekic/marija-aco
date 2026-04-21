import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import ButtonBase from '@mui/material/ButtonBase';

import { Iconify } from 'src/components/iconify';

type Props = {
  onHome: () => void;
  onAdd: () => void;
  onAddNote: () => void;
};

export function DashboardBottomNav({ onHome, onAdd, onAddNote }: Props) {
  return (
    <Box
      sx={(theme) => ({
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: theme.zIndex.appBar + 2,
        display: { xs: 'flex', md: 'none' },
        justifyContent: 'center',
        px: 2,
        pt: 1.25,
        pb: `calc(env(safe-area-inset-bottom) + ${theme.spacing(1.25)})`,
        pointerEvents: 'none',
      })}
    >
      <Paper
        elevation={0}
        sx={(theme) => ({
          width: 1,
          maxWidth: 520,
          borderRadius: 999,
          overflow: 'hidden',
          pointerEvents: 'auto',
          border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.10)}`,
          bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.75),
          backdropFilter: 'blur(18px)',
          boxShadow: `0 20px 50px -24px ${varAlpha(theme.vars.palette.common.blackChannel, 0.8)}`,
        })}
      >
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr auto',
            alignItems: 'center',
          }}
        >
          <ButtonBase
            onClick={onHome}
            sx={(theme) => ({
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              color: theme.vars.palette.text.primary,
            })}
          >
            <Iconify icon="solar:home-angle-2-bold-duotone" width={22} />
            <Box component="span" sx={{ typography: 'subtitle2' }}>
              Home
            </Box>
          </ButtonBase>

          <ButtonBase
            onClick={onAddNote}
            sx={(theme) => ({
              py: 1.5,
              px: 2,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              color: theme.vars.palette.text.primary,
              borderLeft: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
              borderRight: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
            })}
          >
            <Iconify icon="solar:notes-bold-duotone" width={22} />
            <Box component="span" sx={{ typography: 'subtitle2' }}>
              Note
            </Box>
          </ButtonBase>

          <ButtonBase
            onClick={onAdd}
            sx={(theme) => ({
              py: 1.5,
              px: 2.25,
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              justifyContent: 'center',
              color: theme.vars.palette.common.white,
              bgcolor: varAlpha(theme.vars.palette.primary.mainChannel, 0.92),
              '&:hover': { bgcolor: theme.vars.palette.primary.main },
            })}
          >
            <Iconify icon="solar:add-circle-bold" width={22} />
            <Box component="span" sx={{ typography: 'subtitle2' }}>
              Add
            </Box>
          </ButtonBase>
        </Box>
      </Paper>
    </Box>
  );
}
