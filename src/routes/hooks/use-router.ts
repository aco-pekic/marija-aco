import type { NavigateOptions } from 'react-router';

import { useMemo } from 'react';
import { useNavigate } from 'react-router';

// ----------------------------------------------------------------------

export function useRouter() {
  const navigate = useNavigate();

  const router = useMemo(
    () => ({
      back: () => navigate(-1),
      forward: () => navigate(1),
      refresh: () => navigate(0),
      push: (href: string, options?: NavigateOptions) => navigate(href, options),
      replace: (href: string, options?: NavigateOptions) =>
        navigate(href, { ...options, replace: true }),
    }),
    [navigate]
  );

  return router;
}
