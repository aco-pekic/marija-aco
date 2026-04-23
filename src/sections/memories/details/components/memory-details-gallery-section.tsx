import type { DashboardMemoryDetails } from 'src/sections/dashboard/types';

import { varAlpha } from 'minimal-shared/utils';

import Card from '@mui/material/Card';
import { useTheme } from '@mui/material';

import { MemoryGallery } from '../../components/memory-gallery';

type Props = {
  memory: DashboardMemoryDetails;
};

export function MemoryDetailsGallerySection({ memory }: Props) {
  const theme = useTheme();

  return (
    <Card
      sx={{
        p: { xs: 2.5, md: 4 },
        borderRadius: 4,
        position: 'relative',
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.4),
        backdropFilter: 'blur(10px)',
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
        boxShadow: `0 24px 48px -12px ${varAlpha(theme.vars.palette.common.blackChannel, 0.2)}`,
      }}
    >
      <MemoryGallery
        title="Foto priča"
        photos={memory.photos.map((photo) => ({
          id: photo.id,
          src: photo.imageSrc,
          caption: photo.caption,
        }))}
        entityName={memory.title ?? memory.location.name}
      />
    </Card>
  );
}
