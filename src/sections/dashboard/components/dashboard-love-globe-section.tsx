import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

import { LoveGlobe } from 'src/components/love-globe/react-globe';

import type { GlobePlace } from '../types';

type Props = {
  places: GlobePlace[];
  onOpenMap: () => void;
  onOpenPlace: (placeId: string) => void;
};

export function DashboardLoveGlobeSection({ places, onOpenMap, onOpenPlace }: Props) {
  return (
    <Box sx={{ mt: { xs: 3, md: 4 } }}>
      <Typography variant="h5" sx={{ textAlign: 'center' }}>
        LoveGlobe
      </Typography>
      <Typography
        variant="body2"
        sx={(theme) => ({
          textAlign: 'center',
          mt: 0.5,
          color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65),
        })}
      >
        Tap the globe to open the map · Tap a pin to open a mini-gallery · Shared spots show a count badge
      </Typography>

      <Box sx={{ mt: 2 }}>
        <LoveGlobe
          places={places.map((place) => ({ ...place, imageSrc: place.memories[0]?.src }))}
          onOpenMap={onOpenMap}
          onOpenPlace={onOpenPlace}
        />
      </Box>
    </Box>
  );
}
