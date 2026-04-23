import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { DashboardMemoryCard } from './dashboard-memory-card';

import type { DashboardMemory } from '../types';

type Props = {
  memories: DashboardMemory[];
};

export function DashboardUserMemories({ memories }: Props) {
  if (!memories.length) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" sx={{ mb: 1.25 }}>
        <Typography variant="h6">Vaše uspomene</Typography>
        <Typography variant="caption" sx={(theme) => ({ color: theme.vars.palette.text.secondary })}>
          Upravo dodato
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
            <DashboardMemoryCard key={memory.id} memory={memory} />
          ))}
        </Stack>
      </Box>
    </Box>
  );
}
