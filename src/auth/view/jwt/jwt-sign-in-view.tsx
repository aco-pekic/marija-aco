import { z as zod } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { varAlpha } from 'minimal-shared/utils';
import { useBoolean } from 'minimal-shared/hooks';
import { zodResolver } from '@hookform/resolvers/zod';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import LoadingButton from '@mui/lab/LoadingButton';
import InputAdornment from '@mui/material/InputAdornment';
import { useTheme, keyframes } from '@mui/material/styles';

import { useRouter } from 'src/routes/hooks';

import { Iconify } from 'src/components/iconify';
import { Form, Field } from 'src/components/hook-form';

import { useAuthContext } from '../../hooks';
import { signInWithPassword } from '../../context/jwt';

// --- Color Channels ---
const ROSE_CHANNELS = '198 91 124';
const PLUM_CHANNELS = '94 55 80';

// --- Animations ---
const pulse = keyframes`
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.05); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
`;

export type SignInSchemaType = zod.infer<typeof SignInSchema>;

export const SignInSchema = zod.object({
  password: zod.string().min(1, { message: 'Lozinka je obavezna!' }),
});

export function JwtSignInView() {
  const router = useRouter();
  const theme = useTheme();
  const showPassword = useBoolean();
  const { checkUserSession } = useAuthContext();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultValues: SignInSchemaType = {
    password: '',
  };

  const methods = useForm<SignInSchemaType>({
    resolver: zodResolver(SignInSchema),
    defaultValues,
  });

  const {
    handleSubmit,
    formState: { isSubmitting },
  } = methods;

  const onSubmit = handleSubmit(async (data) => {
    try {
      await signInWithPassword({ password: data.password });
      await checkUserSession?.();
      router.refresh();
    } catch (error) {
      console.error(error);
      setErrorMessage('Pogrešna lozinka. Probaj ponovo, ljubavi.');
    }
  });

  return (
    <Box sx={{ textAlign: 'center', mt: '10%' }}>
      {/* --- CUTE HEADER --- */}
      <Stack alignItems="center" spacing={1.5} sx={{ mb: 4 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: varAlpha(ROSE_CHANNELS, 0.1),
            color: `rgb(${ROSE_CHANNELS})`,
            animation: `${pulse} 2s infinite ease-in-out`,
          }}
        >
          <Iconify icon="solar:heart-lock-bold-duotone" width={36} />
        </Box>

        <Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: `rgb(${PLUM_CHANNELS})` }}>
            Dobrodošli nazad
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Unesi lozinku da pristupiš.
          </Typography>
        </Box>
      </Stack>

      <Form methods={methods} onSubmit={onSubmit}>
        <Stack spacing={3}>
          {/* --- PASSWORD FIELD --- */}
          <Field.Text
            name="password"
            label="Tajna lozinka"
            placeholder="Unesi 'marija' ili 'aco'"
            type={showPassword.value ? 'text' : 'password'}
            slotProps={{
              inputLabel: { shrink: true },
              input: {
                sx: {
                  borderRadius: 2,
                  bgcolor: varAlpha(theme.vars.palette.background.neutralChannel, 0.5),
                  '& fieldset': { border: 'none' },
                },
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={showPassword.onToggle} edge="end">
                      <Iconify
                        icon={showPassword.value ? 'solar:eye-bold' : 'solar:eye-closed-bold'}
                      />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          {/* --- CUTE ERROR / INFO BOX --- */}
          {errorMessage ? (
            <Box
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1.5,
                bgcolor: varAlpha(theme.vars.palette.error.mainChannel, 0.08),
                border: `1px solid ${varAlpha(theme.vars.palette.error.mainChannel, 0.2)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: 'error.main', fontWeight: 700 }}>
                {errorMessage}
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                py: 1,
                px: 2,
                borderRadius: 1.5,
                bgcolor: varAlpha(PLUM_CHANNELS, 0.05),
                border: `1px dashed ${varAlpha(PLUM_CHANNELS, 0.15)}`,
              }}
            >
              <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                Nagoveštaj: Tvoje ime je ključ 💖
              </Typography>
            </Box>
          )}

          {/* --- SIGN IN BUTTON --- */}
          <LoadingButton
            fullWidth
            size="large"
            type="submit"
            variant="contained"
            loading={isSubmitting}
            startIcon={<Iconify icon="solar:key-minimalistic-square-bold-duotone" />}
            sx={{
              py: 1.5,
              borderRadius: 2,
              fontWeight: 800,
              fontSize: '1rem',
              background: `linear-gradient(135deg, rgb(${ROSE_CHANNELS}) 0%, #ff84a4 100%)`,
              boxShadow: `0 8px 24px ${varAlpha(ROSE_CHANNELS, 0.35)}`,
              color: 'common.white',
              '&:hover': {
                background: `linear-gradient(135deg, #b04d6b 0%, rgb(${ROSE_CHANNELS}) 100%)`,
              },
            }}
          >
            Otključaj
          </LoadingButton>
        </Stack>
      </Form>
    </Box>
  );
}
