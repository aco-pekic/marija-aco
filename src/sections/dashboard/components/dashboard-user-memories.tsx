import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import CardActionArea from '@mui/material/CardActionArea';

import type { DashboardMemory } from '../types';

type Props = {
  memories: DashboardMemory[];
};

export function DashboardUserMemories({ memories }: Props) {
  if (!memories.length) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.25 }}>
        <Typography variant="h6">Your memories</Typography>
        <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
          Just added
        </Typography>
      </Stack>

      <Box
        sx={{
          overflowX: 'auto',
          pb: 1,
          scrollSnapType: 'x mandatory',
        }}
      >
        <Stack direction="row" spacing={2} sx={{ width: 'max-content' }}>
          {memories.map((memory) => (
            <Card
              key={memory.id}
              sx={(theme) => ({
                width: 260,
                borderRadius: 2,
                scrollSnapAlign: 'start',
                overflow: 'hidden',
                border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
                bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.84),
              })}
            >
              <CardActionArea sx={{ height: 1 }}>
                <Box
                  sx={(theme) => ({
                    height: 150,
                    backgroundImage: `url(${memory.imageSrc})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.06)}`,
                  })}
                />
                <Box sx={{ p: 1.5 }}>
                  <Typography variant="subtitle2" noWrap>
                    {memory.title ?? 'Untitled memory'}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      display: 'block',
                      color: varAlpha(theme.vars.palette.text.primaryChannel, 0.65),
                    })}
                  >
                    {memory.date}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={(theme) => ({
                      display: 'block',
                      mt: 0.25,
                      color: theme.vars.palette.text.secondary,
                    })}
                    noWrap
                  >
                    {memory.location.name}
                  </Typography>
                  {memory.description && (
                    <Typography
                      variant="body2"
                      sx={(theme) => ({
                        mt: 0.75,
                        color: theme.vars.palette.text.secondary,
                        display: '-webkit-box',
                        overflow: 'hidden',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      })}
                    >
                      {memory.description}
                    </Typography>
                  )}
                </Box>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
