import { varAlpha } from 'minimal-shared/utils';
import { useRef, useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Popover from '@mui/material/Popover';
import Collapse from '@mui/material/Collapse';
import TextField from '@mui/material/TextField';
import ButtonBase from '@mui/material/ButtonBase';
import Typography from '@mui/material/Typography';

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

type Props = {
  title: string;
  value: Vibe;
  onChange: (next: Vibe) => void;
  forceNoteEditor?: boolean;
};

export function VibeCard({ title, value, onChange, forceNoteEditor }: Props) {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const isOpen = !!anchorEl;

  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isEditing, setIsEditing] = useState(() => !!forceNoteEditor || !!value.text.trim());

  useEffect(() => {
    if (forceNoteEditor) setIsEditing(true);
  }, [forceNoteEditor]);

  useEffect(() => {
    if (!isEditing) return undefined;
    const timeoutId = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [isEditing]);

  const pickRandomEmoji = () => {
    if (vibeEmojis.length < 2) return value.emoji;

    let next = value.emoji;
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const candidate = vibeEmojis[Math.floor(Math.random() * vibeEmojis.length)];
      if (candidate !== value.emoji) {
        next = candidate;
        break;
      }
    }
    return next;
  };

  return (
    <Card
      sx={(theme) => ({
        overflow: 'hidden',
        position: 'relative',
        borderRadius: 2,
        bgcolor: varAlpha(theme.vars.palette.background.paperChannel, 0.38),
        backdropFilter: 'blur(12px)',
        border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.10)}`,
        boxShadow: `0 12px 32px -18px ${varAlpha(theme.vars.palette.common.blackChannel, 0.8)}`,
      })}
    >
      <Box
        sx={(theme) => ({
          p: 2,
          position: 'relative',
          '&::before': theme.mixins.borderGradient({
            padding: '1px',
            color: `linear-gradient(135deg, ${varAlpha(
              theme.vars.palette.secondary.mainChannel,
              0.22
            )}, ${varAlpha(theme.vars.palette.primary.mainChannel, 0.18)})`,
          }),
        })}
      >
        <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 1.25 }}>
          <Typography variant="subtitle2" sx={{ flex: '1 1 auto' }}>
            {title}
          </Typography>

          <Button
            size="small"
            variant="text"
            onClick={(event) => setAnchorEl(event.currentTarget)}
            sx={(theme) => ({
              minWidth: 38,
              px: 1,
              borderRadius: 1.25,
              color: theme.vars.palette.common.white,
              bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.08),
              '&:hover': { bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.12) },
            })}
          >
            <Box component="span" sx={{ fontSize: 16 }}>
              {value.emoji}
            </Box>
          </Button>

          <Popover
            anchorEl={anchorEl}
            open={isOpen}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: (theme) => ({
                  mt: 1,
                  width: 320,
                  borderRadius: 2,
                  overflow: 'hidden',
                  bgcolor: theme.vars.palette.background.paper,
                  border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
                }),
              },
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ p: 1.25 }}>
              <Typography variant="subtitle2">Pick a vibe</Typography>
              <Button
                size="small"
                onClick={() => onChange({ ...value, emoji: pickRandomEmoji() })}
                startIcon={<Iconify icon="solar:magic-stick-3-bold-duotone" width={18} />}
                sx={{ borderRadius: 1.25 }}
              >
                Surprise me
              </Button>
            </Stack>

            <Divider />

            <Box
              sx={{
                p: 1.25,
                display: 'grid',
                gap: 0.75,
                gridTemplateColumns: 'repeat(8, minmax(0, 1fr))',
              }}
            >
              {vibeEmojis.map((emoji) => {
                const isSelected = emoji === value.emoji;
                return (
                  <ButtonBase
                    key={emoji}
                    onClick={() => {
                      onChange({ ...value, emoji });
                      setAnchorEl(null);
                    }}
                    sx={(theme) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 1.25,
                      display: 'grid',
                      placeItems: 'center',
                      fontSize: 18,
                      border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, isSelected ? 0.26 : 0.12)}`,
                      bgcolor: varAlpha(
                        theme.vars.palette.common.whiteChannel,
                        isSelected ? 0.12 : 0.06
                      ),
                      transition: theme.transitions.create(['transform', 'background-color'], {
                        duration: theme.transitions.duration.shorter,
                      }),
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.12),
                      },
                    })}
                  >
                    {emoji}
                  </ButtonBase>
                );
              })}
            </Box>
          </Popover>
        </Stack>

        {!forceNoteEditor && !value.text.trim() && !isEditing ? (
          <ButtonBase
            onClick={() => setIsEditing(true)}
            sx={(theme) => ({
              width: 1,
              p: 1.25,
              borderRadius: 1.25,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: theme.vars.palette.common.white,
              bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.06),
              border: `1px solid ${varAlpha(theme.vars.palette.common.whiteChannel, 0.08)}`,
              '&:hover': { bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.10) },
            })}
          >
            <Iconify icon="solar:pen-new-square-bold-duotone" width={18} />
            <Box component="span" sx={{ typography: 'subtitle2' }}>
              Add note
            </Box>
          </ButtonBase>
        ) : (
          <Collapse in={forceNoteEditor ? true : isEditing} timeout={180} unmountOnExit={!forceNoteEditor}>
            <TextField
              size="small"
              inputRef={inputRef}
              value={value.text}
              onChange={(e) => onChange({ ...value, text: e.target.value })}
              onBlur={() => {
                if (forceNoteEditor) return;
                if (!value.text.trim()) setIsEditing(false);
              }}
              placeholder='Npr. "Jedva čekam vikend"'
              fullWidth
              slotProps={{
                input: {
                  sx: (theme) => ({
                    bgcolor: varAlpha(theme.vars.palette.common.whiteChannel, 0.06),
                    borderRadius: 1.25,
                  }),
                },
              }}
            />
          </Collapse>
        )}
      </Box>
    </Card>
  );
}
