import type { Theme } from '@mui/material/styles';

import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Avatar from '@mui/material/Avatar';

type Props = {
  name: string;
  ring: string;
  src?: string;
  initialsBg: (theme: Theme) => string;
};

export function AvatarWithGlow({ name, ring, src, initialsBg }: Props) {
  return (
    <Box
      sx={(theme) => ({
        position: 'relative',
        borderRadius: '50%',
        p: '4px',
        '&::before': {
          ...theme.mixins.borderGradient({
            padding: '2px',
            color: ring,
          }),
        },
        boxShadow: `0 0 0 1px ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}, 0 0 28px 0 ${varAlpha(
          theme.vars.palette.primary.mainChannel,
          0.18
        )}`,
      })}
    >
      <Avatar
        alt={name}
        src={src}
        sx={(theme) => ({
          width: 80,
          height: 80,
          fontWeight: 800,
          fontSize: 28,
          bgcolor: initialsBg(theme),
          color: theme.vars.palette.common.white,
          border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.12)}`,
        })}
      >
        {name
          .split(' ')
          .slice(0, 2)
          .map((part) => part[0]?.toUpperCase())
          .join('')}
      </Avatar>
    </Box>
  );
}

