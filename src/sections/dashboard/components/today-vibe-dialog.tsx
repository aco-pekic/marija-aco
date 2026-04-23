import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import { CircularProgress } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogTitle from '@mui/material/DialogTitle';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { VibeCard } from './vibe-card';

import type { Vibe, DashboardPerson } from '../types';

type Props = {
  open: boolean;
  currentPerson: DashboardPerson;
  marija: Vibe;
  aco: Vibe;
  onClose: () => void;
  onChangeMarija: (next: Vibe) => void;
  onChangeAco: (next: Vibe) => void;
  isSaving?: boolean;
  saveError?: string | null;
};

const ROSE_CHANNELS = '198 91 124';

export function TodayVibeDialog({
  open,
  currentPerson,
  marija,
  aco,
  onClose,
  onChangeMarija,
  onChangeAco,
  isSaving = false,
  saveError,
}: Props) {
  const theme = useTheme();
  const isMarija = currentPerson === 'marija';
  const activeTitle = isMarija ? 'Marija' : 'Aco';
  const activeVibe = isMarija ? marija : aco;
  const handleChange = isMarija ? onChangeMarija : onChangeAco;
  const canDeleteNote = !!activeVibe.text.trim();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs" // Smanjen za intimniji osećaj
      PaperProps={{
        sx: {
          borderRadius: 4,
          bgcolor: 'background.paper',
          backgroundImage: `radial-gradient(circle at top right, ${varAlpha(ROSE_CHANNELS, 0.08)}, transparent 40%)`,
        },
      }}
    >
      <DialogTitle sx={{ p: 3, pb: 2 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Kako si danas?
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'text.secondary',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              {activeTitle} · Raspoloženje
            </Typography>
          </Stack>
          <IconButton onClick={onClose} sx={{ bgcolor: 'background.neutral' }}>
            <Iconify icon="solar:close-circle-bold-duotone" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent sx={{ p: 3, pt: 0 }}>
        {saveError && (
          <Box sx={{ mb: 2, p: 1, borderRadius: 1, bgcolor: 'error.soft', color: 'error.main' }}>
            <Typography variant="caption" sx={{ fontWeight: 700 }}>
              {saveError}
            </Typography>
          </Box>
        )}

        <VibeCard title={activeTitle} value={activeVibe} onChange={handleChange} forceNoteEditor />
      </DialogContent>

      <Divider sx={{ borderStyle: 'dashed' }} />

      <DialogActions sx={{ p: 3, justifyContent: 'space-between' }}>
        <Box>
          {canDeleteNote && (
            <IconButton
              color="error"
              onClick={() => {
                if (window.confirm('Obrisati poruku?')) handleChange({ ...activeVibe, text: '' });
              }}
              sx={{ bgcolor: varAlpha('255 76 97', 0.1) }}
            >
              <Iconify icon="solar:trash-bin-trash-bold-duotone" width={20} />
            </IconButton>
          )}
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button color="inherit" sx={{ fontWeight: 700 }} onClick={onClose}>
            Odustani
          </Button>
          <Button
            variant="contained"
            onClick={onClose}
            disabled={isSaving}
            startIcon={
              isSaving ? <CircularProgress size={18} /> : <Iconify icon="solar:check-circle-bold" />
            }
            sx={{
              borderRadius: 2,
              px: 3,
              fontWeight: 800,
              background: `linear-gradient(135deg, rgb(${ROSE_CHANNELS}) 0%, #ff84a4 100%)`,
              boxShadow: `0 8px 20px ${varAlpha(ROSE_CHANNELS, 0.3)}`,
            }}
          >
            {isSaving ? 'Čuvam...' : 'Gotovo'}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
