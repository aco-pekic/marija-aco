import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import type { GlobePlace } from '../types';

type Props = {
  open: boolean;
  places: GlobePlace[];
  onClose: () => void;
  onSelectPlace: (place: GlobePlace) => void;
};

export function DashboardMapDialog({ open, places, onClose, onSelectPlace }: Props) {
  return (
    <Dialog fullScreen open={open} onClose={onClose}>
      <Box
        sx={(theme) => ({
          minHeight: 1,
          bgcolor: theme.vars.palette.background.default,
          color: theme.vars.palette.text.primary,
        })}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Stack spacing={0.25}>
            <Typography variant="h6">Your map</Typography>
            <Typography
              variant="body2"
              sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.68) })}
            >
              Visited & wishlist places
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>

        <Divider />

        <Box sx={{ p: 2 }}>
          <Box
            sx={(theme) => ({
              height: { xs: 320, sm: 420 },
              borderRadius: 3,
              overflow: 'hidden',
              position: 'relative',
              border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
              bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.04),
              backgroundImage:
                'radial-gradient(circle at 30% 20%, rgba(59,130,246,0.25), transparent 60%), radial-gradient(circle at 80% 60%, rgba(245,158,11,0.18), transparent 60%)',
            })}
          >
            <Box
              aria-hidden
              sx={{
                position: 'absolute',
                inset: 0,
                backgroundImage: 'url(/assets/background/overlay.svg)',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'center',
                backgroundSize: 'cover',
                opacity: 0.35,
              }}
            />

            <Stack spacing={1} sx={{ position: 'relative', p: 2 }}>
              {places.map((place) => (
                <Button
                  key={place.id}
                  onClick={() => onSelectPlace(place)}
                  variant="outlined"
                  sx={(theme) => ({
                    justifyContent: 'space-between',
                    borderRadius: 2,
                    borderColor: varAlpha(theme.vars.palette.common.whiteChannel, 0.14),
                    bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.05),
                    '&:hover': { bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08) },
                  })}
                  endIcon={<Iconify icon="solar:gallery-line-duotone" width={18} />}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box
                      sx={(theme) => ({
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor:
                          place.status === 'visited'
                            ? theme.vars.palette.primary.main
                            : theme.vars.palette.warning.main,
                        boxShadow: `0 0 18px ${varAlpha(
                          place.status === 'visited'
                            ? theme.vars.palette.primary.mainChannel
                            : theme.vars.palette.warning.mainChannel,
                          0.55
                        )}`,
                      })}
                    />
                    <Typography variant="subtitle2">{place.name}</Typography>
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65) })}
                  >
                    {place.status === 'visited' ? 'Visited' : 'Wishlist'}
                  </Typography>
                </Button>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>
    </Dialog>
  );
}
