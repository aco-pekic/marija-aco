import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import { Iconify } from 'src/components/iconify';

import type { GlobePlace } from '../types';

type Props = {
  places: GlobePlace[];
};

export function DashboardQuickMemories({ places }: Props) {
  return (
    <Box sx={{ mt: { xs: 3, md: 4 } }}>
      <Stack
        direction="row"
        alignItems="baseline"
        justifyContent="space-between"
        sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 0, md: 1 } }}
      >
        <Typography variant="h6">Quick Memories</Typography>
        <Button size="small" endIcon={<Iconify icon="solar:arrow-right-outline" width={16} />}>
          See all
        </Button>
      </Stack>

      <Box
        sx={{
          maxWidth: 1100,
          mx: 'auto',
          mt: 1.5,
          px: { xs: 0, md: 1 },
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x mandatory',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ width: 'max-content' }}>
          {places
            .flatMap((p) => p.memories.map((m) => ({ place: p.name, ...m })))
            .slice(0, 4)
            .map((item) => (
              <Card
                key={`${item.place}-${item.label}`}
                sx={(theme) => ({
                  width: 240,
                  borderRadius: 2,
                  scrollSnapAlign: 'start',
                  border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
                })}
              >
                <CardActionArea sx={{ height: 1 }}>
                  <Box
                    sx={(theme) => ({
                      height: 140,
                      backgroundImage: `url(${item.src})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      borderBottom: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
                    })}
                  />
                  <Box sx={{ p: 1.5 }}>
                    <Typography variant="subtitle2" noWrap>
                      {item.label}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={(theme) => ({ color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65) })}
                    >
                      {item.place} · {item.date}
                    </Typography>
                  </Box>
                </CardActionArea>
              </Card>
            ))}
        </Stack>
      </Box>
    </Box>
  );
}
