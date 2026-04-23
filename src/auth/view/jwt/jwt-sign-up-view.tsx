import Link from '@mui/material/Link';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';

import { paths } from 'src/routes/paths';
import { RouterLink } from 'src/routes/components';

import { FormHead } from '../../components/form-head';

// ----------------------------------------------------------------------

export function JwtSignUpView() {
  return (
    <>
      <FormHead
        title="Sign up disabled"
        description="This app uses two local passcodes for access."
        sx={{ textAlign: { xs: 'center', md: 'left' } }}
      />

      <Alert severity="info" sx={{ mb: 3 }}>
        Use <strong>marija</strong> or <strong>aco</strong> on the sign-in page.
      </Alert>

      <Button component={RouterLink} href={paths.auth.jwt.signIn} variant="contained" color="inherit">
        Back to sign in
      </Button>

      <Link component={RouterLink} href={paths.auth.jwt.signIn} variant="body2" sx={{ mt: 2, display: 'block' }}>
        Open sign in
      </Link>
    </>
  );
}
