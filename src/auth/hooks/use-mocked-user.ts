import { useLocalStorage } from 'minimal-shared/hooks';

import { DASHBOARD_MEDIA_STORAGE_KEY } from 'src/sections/dashboard/constants';

import { ACCOUNT_PROFILES } from 'src/auth/context/jwt/profiles';
import { normalizeAccountId, getSessionAccountId } from 'src/auth/context/jwt/utils';

import { useAuthContext } from './use-auth-context';

// ----------------------------------------------------------------------

type DashboardMediaCache = {
  marijaAvatar?: string;
  acoAvatar?: string;
};

export function useMockedUser() {
  const { user } = useAuthContext();
  const { state: dashboardMedia } = useLocalStorage<DashboardMediaCache>(
    DASHBOARD_MEDIA_STORAGE_KEY,
    {}
  );

  const resolveProfile = (accountId: 'marija' | 'aco') => {
    const baseProfile = ACCOUNT_PROFILES[accountId];
    const photoURL =
      (accountId === 'marija' ? dashboardMedia.marijaAvatar : dashboardMedia.acoAvatar) ??
      baseProfile.photoURL;

    return { ...baseProfile, photoURL };
  };

  const sessionAccountId = typeof window !== 'undefined' ? getSessionAccountId() : null;

  if (sessionAccountId) {
    return { user: resolveProfile(sessionAccountId) };
  }

  const normalizedUserAccountId = normalizeAccountId(
    typeof user === 'object' && user
      ? String((user as any).accountId ?? (user as any).id ?? '')
      : null
  );

  if (normalizedUserAccountId) {
    return { user: resolveProfile(normalizedUserAccountId) };
  }

  if (user) return { user };

  return {
    user: {
      id: 'guest',
      displayName: 'Guest',
      email: 'guest@app.local',
      photoURL: '/assets/images/mock/avatar/avatar-1.webp',
      role: 'guest',
    },
  };
}
