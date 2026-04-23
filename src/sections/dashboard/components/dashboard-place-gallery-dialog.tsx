import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';

import type { GlobePlace } from '../types';

type Props = {
  place: GlobePlace | null;
  onClose: () => void;
};

export function DashboardPlaceGalleryDialog({ place, onClose }: Props) {
  return (
    <Dialog open={!!place} onClose={onClose} maxWidth="sm" fullWidth>
      <Box
        sx={(theme) => ({
          bgcolor: theme.vars.palette.background.paper,
          color: theme.vars.palette.text.primary,
        })}
      >
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 2 }}>
          <Stack spacing={0.25}>
            <Typography variant="h6">{place?.name}</Typography>
            <Typography
              variant="body2"
              sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65) })}
            >
              Mini galerija
            </Typography>
          </Stack>
          <IconButton onClick={onClose}>
            <Iconify icon="solar:close-circle-bold" />
          </IconButton>
        </Stack>
        <Divider />

        <Box sx={{ p: 2 }}>
          <Stack spacing={1.5}>
            {(place?.memories ?? []).map((memory) => (
              <Card
                key={memory.label}
                sx={(theme) => ({
                  overflow: 'hidden',
                  borderRadius: 2,
                  border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
                })}
              >
                <Box
                  sx={(theme) => ({
                    height: 180,
                    backgroundImage: `url(${memory.src})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
                  })}
                />
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {memory.label}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65) })}
                  >
                    {memory.date}
                  </Typography>
                </Box>
              </Card>
            ))}
          </Stack>
        </Box>
      </Box>
    </Dialog>
  );
}
