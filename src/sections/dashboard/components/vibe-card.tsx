import { useRef, useState } from 'react';
import { varAlpha } from 'minimal-shared/utils';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Popover from '@mui/material/Popover';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';
import { useTheme, IconButton } from '@mui/material';

import { Iconify } from 'src/components/iconify';

import type { Vibe } from '../types';

const vibeEmojis = [
  '✨',
  '💙',
  '🥰',
  '😴',
  '🔥',
  '🌙',
  '☕️',
  '🏃‍♀️',
  '🧠',
  '🍷',
  '🌸',
  '🍓',
  '🌻',
  '🎧',
  '🎒',
  '🗺️',
  '✈️',
  '🏔️',
  '🌊',
  '📸',
  '🧋',
  '🍕',
  '🕯️',
  '🎀',
  '💌',
  '🫶',
  '😌',
  '🥺',
  '🤍',
  '🌈',
  '⭐️',
  '🥐',
  '🍜',
  '🍦',
  '🪩',
  '🧸',
] as const;

function pickRandomEmoji(currentEmoji?: string) {
  const available = currentEmoji
    ? vibeEmojis.filter((emoji) => emoji !== currentEmoji)
    : [...vibeEmojis];

  return available[Math.floor(Math.random() * available.length)] ?? vibeEmojis[0];
}

type Props = {
  title: string;
  value: Vibe;
  onChange?: (next: Vibe) => void;
  forceNoteEditor?: boolean;
  editable?: boolean;
};

const ROSE_CHANNELS = '198 91 124';
const PLUM_CHANNELS = '94 55 80';

export function VibeCard({
  title: _title,
  value,
  onChange,
  forceNoteEditor: _forceNoteEditor,
  editable = true,
}: Props) {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = !!anchorEl;
  const inputRef = useRef<HTMLInputElement | null>(null);
  void _title;
  void _forceNoteEditor;

  const updateValue = (next: Vibe) => onChange?.(next);

  return (
    <Box sx={{ position: 'relative' }}>
      <Stack spacing={2.5} alignItems="center">
        {/* Veliki Emoji Prikaz */}
        <ButtonBase
          onClick={(e) => editable && setAnchorEl(e.currentTarget)}
          sx={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            fontSize: 48,
            bgcolor: varAlpha(ROSE_CHANNELS, 0.05),
            border: `2px solid ${varAlpha(ROSE_CHANNELS, 0.1)}`,
            boxShadow: `0 12px 32px -12px ${varAlpha(ROSE_CHANNELS, 0.3)}`,
            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            ...(editable && {
              '&:hover': {
                transform: 'scale(1.1) rotate(5deg)',
                bgcolor: varAlpha(ROSE_CHANNELS, 0.1),
              },
            }),
          }}
        >
          {value.emoji}
          {editable && (
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                bgcolor: 'white',
                borderRadius: '50%',
                p: 0.5,
                boxShadow: 2,
              }}
            >
              <Iconify icon="solar:pen-bold" width={14} sx={{ color: 'primary.main' }} />
            </Box>
          )}
        </ButtonBase>

        {/* Note Unos */}
        <Box sx={{ width: 1 }}>
          <TextField
            fullWidth
            multiline
            rows={2}
            inputRef={inputRef}
            value={value.text}
            onChange={(e) => updateValue({ ...value, text: e.target.value })}
            placeholder="Napiši kratku poruku o tome kako se osećaš..."
            disabled={!editable}
            slotProps={{
              input: {
                sx: {
                  borderRadius: 2,
                  bgcolor: varAlpha(theme.vars.palette.background.neutralChannel, 0.5),
                  border: 'none',
                  '& fieldset': { border: 'none' },
                  textAlign: 'center',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: `rgb(${PLUM_CHANNELS})`,
                },
              },
            }}
          />
        </Box>
      </Stack>

      {/* Emoji Picker Popover */}
      <Popover
        open={isOpen}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        slotProps={{
          paper: {
            sx: {
              mt: 1.5,
              p: 2,
              width: 320,
              borderRadius: 3,
              boxShadow: `0 20px 40px ${varAlpha(PLUM_CHANNELS, 0.2)}`,
              border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.1)}`,
            },
          },
        }}
      >
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
              Izaberi vibe
            </Typography>
            <IconButton
              size="small"
              onClick={() => updateValue({ ...value, emoji: pickRandomEmoji(value.emoji) })}
            >
              <Iconify icon="solar:magic-stick-3-bold-duotone" sx={{ color: 'primary.main' }} />
            </IconButton>
          </Stack>

          <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: 'repeat(6, 1fr)' }}>
            {vibeEmojis.map((emoji) => (
              <ButtonBase
                key={emoji}
                onClick={() => {
                  updateValue({ ...value, emoji });
                  setAnchorEl(null);
                }}
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: 1.5,
                  fontSize: 22,
                  transition: '0.2s',
                  bgcolor: emoji === value.emoji ? varAlpha(ROSE_CHANNELS, 0.1) : 'transparent',
                  '&:hover': { bgcolor: varAlpha(ROSE_CHANNELS, 0.05), transform: 'scale(1.2)' },
                }}
              >
                {emoji}
              </ButtonBase>
            ))}
          </Box>
        </Stack>
      </Popover>
    </Box>
  );
}
