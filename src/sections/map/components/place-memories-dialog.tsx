import type { PlaceStatus, DashboardMemory } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Dialog from '@mui/material/Dialog';
import { useTheme } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DialogContent from '@mui/material/DialogContent';

import { Iconify } from 'src/components/iconify';

import { DashboardMemoryCard } from 'src/sections/dashboard/components/dashboard-memory-card';

type Place = {
  id: string;
  name: string;
  status: PlaceStatus;
  memories: DashboardMemory[];
};

type Props = {
  open: boolean;
  place: Place | null;
  onClose: () => void;
  roseChannels: string;
  plumChannels: string;
};

export function PlaceMemoriesDialog({ open, place, onClose, roseChannels, plumChannels }: Props) {
  const theme = useTheme();

  const heroSrc = place?.memories[0]?.imageSrc;
  const isWishlist = place?.status === 'wishlist';

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen={false} // Isključeno da bi bio "cute" card
      scroll="paper"
      maxWidth="sm" // Smanjen maxWidth za intimniji look
      fullWidth
      PaperProps={{
        sx: {
          overflow: 'hidden',
          m: 2, // Margina na mobilnom da bi "plutao"
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: `1px solid ${varAlpha(plumChannels, 0.1)}`,
          boxShadow: `0 32px 64px -16px ${varAlpha(plumChannels, 0.3)}`,
          maxHeight: 'calc(100% - 64px)',
        },
      }}
    >
      {place ? (
        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
          {/* --- HERO HEADER: Polaroid style --- */}
          <Box
            sx={{
              position: 'relative',
              height: { xs: 200, sm: 240 },
              m: 1.5, // Mali padding oko slike da izgleda kao okvir
              borderRadius: 3,
              overflow: 'hidden',
              backgroundImage: heroSrc ? `url(${heroSrc})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              bgcolor: varAlpha(roseChannels, 0.1),
              boxShadow: `0 8px 24px -8px ${varAlpha(plumChannels, 0.2)}`,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%)',
              }}
            />

            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                zIndex: 10,
                color: 'common.white',
                bgcolor: 'rgba(0,0,0,0.2)',
                backdropFilter: 'blur(8px)',
                '&:hover': { bgcolor: 'rgba(0,0,0,0.4)' },
              }}
            >
              <Iconify icon="solar:close-circle-bold" width={22} />
            </IconButton>

            {/* Title Badge Over Image */}
            <Stack
              spacing={0.5}
              sx={{
                position: 'absolute',
                left: 16,
                bottom: 16,
                right: 16,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: 'common.white',
                  textShadow: '0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                {place.name.split(',')[0]}
              </Typography>

              <Stack direction="row" spacing={1}>
                <Box
                  sx={{
                    px: 1,
                    py: 0.25,
                    borderRadius: 0.75,
                    bgcolor: isWishlist ? 'warning.main' : 'primary.main',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                  }}
                >
                  <Iconify
                    icon={isWishlist ? 'solar:heart-bold' : 'solar:map-point-bold'}
                    width={12}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontWeight: 800, fontSize: 10, textTransform: 'uppercase' }}
                  >
                    {isWishlist ? 'Wishlist' : 'Obišli smo'}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>

          {/* --- CONTENT --- */}
          <DialogContent sx={{ p: 2.5, pt: 1, pb: 4 }}>
            {!isWishlist && place.memories.length > 0 ? (
              <Box>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                  <Iconify
                    icon="solar:gallery-wide-bold-duotone"
                    width={20}
                    sx={{ color: `rgb(${roseChannels})` }}
                  />
                  <Typography
                    variant="subtitle2"
                    sx={{ fontWeight: 800, color: `rgb(${plumChannels})` }}
                  >
                    Naše uspomene ({place.memories.length})
                  </Typography>
                </Stack>

                <Box
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    overflowX: 'auto',
                    pb: 1,
                    px: 0.5,
                    mx: -0.5,
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  }}
                >
                  {place.memories.map((memory) => (
                    <Box key={memory.id} sx={{ flexShrink: 0 }}>
                      <DashboardMemoryCard memory={memory} />
                    </Box>
                  ))}
                </Box>
              </Box>
            ) : (
              <Stack
                spacing={2}
                alignItems="center"
                sx={{
                  py: 4,
                  px: 2,
                  textAlign: 'center',
                  borderRadius: 3,
                  bgcolor: varAlpha(roseChannels, 0.03),
                  border: `1px dashed ${varAlpha(plumChannels, 0.15)}`,
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: varAlpha(roseChannels, 0.1),
                    color: `rgb(${roseChannels})`,
                  }}
                >
                  <Iconify icon="solar:stars-bold-duotone" width={28} />
                </Box>
                <Box>
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 800, color: `rgb(${plumChannels})` }}
                  >
                    Zamisli želju...
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: 'text.secondary', mt: 0.5, maxWidth: 240 }}
                  >
                    Ovo mesto nas tek čeka. Jedva čekam da ovde napravimo prvu sliku! 💖
                  </Typography>
                </Box>
              </Stack>
            )}
          </DialogContent>
        </Box>
      ) : null}
    </Dialog>
  );
}
