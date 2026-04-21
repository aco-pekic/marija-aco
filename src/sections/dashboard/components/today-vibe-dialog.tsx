import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { VibeCard } from './vibe-card';

import type { Vibe } from '../types';

type Props = {
  open: boolean;
  marija: Vibe;
  aco: Vibe;
  onClose: () => void;
  onChangeMarija: (next: Vibe) => void;
  onChangeAco: (next: Vibe) => void;
  isSaving?: boolean;
  saveError?: string | null;
};

export function TodayVibeDialog({
  open,
  marija,
  aco,
  onClose,
  onChangeMarija,
  onChangeAco,
  isSaving = false,
  saveError,
}: Props) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Stack spacing={0.25}>
            <Typography variant="h6">Today vibe</Typography>
            <Typography variant="body2" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
              A tiny note for today — resets at midnight
            </Typography>
            {saveError ? (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.error.main })}>
                {saveError}
              </Typography>
            ) : isSaving ? (
              <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
                Saving changes…
              </Typography>
            ) : null}
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        <Box
          sx={(theme) => ({
            display: 'grid',
            gap: 2,
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, minmax(0, 1fr))' },
          })}
        >
          <VibeCard title="Marija" value={marija} onChange={onChangeMarija} forceNoteEditor />
          <VibeCard title="Aco" value={aco} onChange={onChangeAco} forceNoteEditor />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button variant="outlined" color="inherit" onClick={onClose}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          startIcon={<Iconify icon="solar:check-circle-bold-duotone" />}
          sx={(theme) => ({
            boxShadow: `0 18px 40px -22px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.85)}`,
          })}
        >
          Done
        </Button>
      </DialogActions>
    </Dialog>
  );
}
