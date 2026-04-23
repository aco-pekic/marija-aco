import type { Slide } from 'yet-another-react-lightbox';

import { useRef } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import { Stack } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import useMediaQuery from '@mui/material/useMediaQuery';

import 'src/components/lightbox/styles.css';
import { Image } from 'src/components/image';
import { Iconify } from 'src/components/iconify';
import { Lightbox, useLightBox } from 'src/components/lightbox';

type GalleryPhoto = {
  id: string;
  src: string;
  caption?: string;
};

type Props = {
  title?: string;
  photos: GalleryPhoto[];
  entityName?: string;
};

export function MemoryGallery({ title = 'Foto priča', photos, entityName }: Props) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'));
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const slides: Slide[] = photos.map((photo) => ({
    src: photo.src,
    title: photo.caption ?? title,
  }));
  const { open, selected, onOpen, onClose, setSelected } = useLightBox(slides);

  // Scroll logic stays the same but with refined distance
  const scrollByAmount = (direction: 'left' | 'right') => {
    const el = scrollerRef.current;
    if (!el) return;
    const offset = direction === 'left' ? -300 : 300;
    el.scrollBy({ left: offset, behavior: 'smooth' });
  };

  if (!photos.length) return null; // Or your "empty" state

  return (
    <Box>
      {/* --- HEADER: Cute & Clean --- */}
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: 'primary.main',
              color: 'white',
              boxShadow: `0 4px 12px ${varAlpha(theme.vars.palette.primary.mainChannel, 0.4)}`,
            }}
          >
            <Iconify icon="solar:camera-square-bold-duotone" width={20} />
          </Box>
          <Box>
            <Typography variant="h6" sx={{ lineHeight: 1.2, fontWeight: 800 }}>
              {title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600 }}>
              {photos.length} momenata sačuvanih zauvek
            </Typography>
          </Box>
        </Stack>

        {mdUp && (
          <Stack direction="row" spacing={1}>
            <IconButton
              onClick={() => scrollByAmount('left')}
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Iconify icon="solar:alt-arrow-left-outline" />
            </IconButton>
            <IconButton
              onClick={() => scrollByAmount('right')}
              size="small"
              sx={{ border: '1px solid', borderColor: 'divider' }}
            >
              <Iconify icon="solar:alt-arrow-right-outline" />
            </IconButton>
          </Stack>
        )}
      </Stack>

      {/* --- SCROLLER: Polaroid Style --- */}
      <Box
        ref={scrollerRef}
        sx={{
          display: 'flex',
          gap: { xs: 2, md: 3 },
          overflowX: 'auto',
          px: { xs: 0.5, md: 1 },
          py: 2,
          scrollbarWidth: 'none',
          scrollSnapType: 'x proximity', // Feels amazing on mobile
          '&::-webkit-scrollbar': { display: 'none' },
        }}
      >
        {photos.map((photo, index) => (
          <Box
            key={photo.id}
            onClick={() => onOpen(photo.src)}
            sx={{
              flex: '0 0 auto',
              width: { xs: 240, md: 300 },
              scrollSnapAlign: 'center',
              cursor: 'pointer',
              position: 'relative',
              transition: theme.transitions.create(['transform', 'box-shadow']),
              // Slight rotation pattern for "Scrapbook" feel
              transform: index % 2 === 0 ? 'rotate(-1deg)' : 'rotate(1deg)',
              '&:hover': {
                transform: 'translateY(-8px) rotate(0deg)',
                zIndex: 10,
                '& .photo-caption': { opacity: 1 },
              },
            }}
          >
            {/* White Border Frame (Modern Polaroid) */}
            <Box
              sx={{
                p: 1,
                pb: photo.caption ? 4 : 1, // Larger bottom if there is text
                bgcolor: 'common.white',
                borderRadius: 1.5,
                boxShadow: `0 12px 24px -8px ${varAlpha(theme.vars.palette.common.blackChannel, 0.3)}`,
              }}
            >
              <Image
                src={photo.src}
                alt={entityName}
                ratio="4/5" // Portrait photos look more "Insta/Cute"
                sx={{ borderRadius: 1 }}
              />

              {photo.caption && (
                <Typography
                  className="photo-caption"
                  variant="caption"
                  sx={{
                    display: 'block',
                    mt: 1.5,
                    textAlign: 'center',
                    color: 'grey.800',
                    fontFamily: 'cursive', // Or just a soft sans-serif
                    fontWeight: 500,
                    opacity: 0.8,
                    transition: 'opacity 0.2s',
                  }}
                >
                  {photo.caption}
                </Typography>
              )}
            </Box>

            {/* Subtle "Tape" effect on some photos */}
            {index % 3 === 0 && (
              <Box
                sx={{
                  position: 'absolute',
                  top: -10,
                  left: '50%',
                  transform: 'translateX(-50%) rotate(-2deg)',
                  width: 60,
                  height: 20,
                  bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.2),
                  backdropFilter: 'blur(4px)',
                  border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
                  zIndex: 2,
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      <Lightbox
        slides={slides}
        open={open}
        index={selected}
        close={onClose}
        onGetCurrentIndex={setSelected}
        // Simplified lightbox for mobile "clean" feel
        disableThumbnails
        disableZoom
      />
    </Box>
  );
}
