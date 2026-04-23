import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';

import { Iconify } from 'src/components/iconify';
import { LoveGlobe } from 'src/components/love-globe/react-globe';

import type { GlobePlace, DashboardWish } from '../types';

type Props = {
  places: GlobePlace[];
  wishes: DashboardWish[];
  onOpenMap: () => void;
  onOpenPlace: (placeId: string) => void;
  onAddWish: () => void;
  onEditWish: (wishId: string) => void;
};

export function DashboardLoveGlobeSection({
  places,
  wishes,
  onOpenMap,
  onOpenPlace,
  onAddWish,
  onEditWish,
}: Props) {
  return (
    <Box sx={{ mt: { xs: 3, md: 4 } }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ gap: 2 }}>
        <Typography variant="h5">LoveGlobe</Typography>
        <Button
          size="small"
          variant="contained"
          onClick={onAddWish}
          startIcon={<Iconify icon="solar:add-circle-bold" width={18} />}
        >
          Želja
        </Button>
      </Stack>

      <Box sx={{ mt: 2 }}>
        <LoveGlobe
          places={places.map((place) => ({
            ...place,
            imageSrc: place.memories[0]?.src,
            markerVariant: place.id.startsWith('wish-') ? 'heart' : undefined,
          }))}
          onOpenMap={onOpenMap}
          onOpenPlace={onOpenPlace}
        />
      </Box>
    </Box>
  );
}
