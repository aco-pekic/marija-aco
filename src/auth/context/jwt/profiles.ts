import type { LocalAccountId } from './utils';

export type AccountProfile = {
  id: LocalAccountId;
  accountId: LocalAccountId;
  displayName: string;
  email: string;
  photoURL: string;
  role: 'admin';
};

export const ACCOUNT_PROFILES: Record<LocalAccountId, AccountProfile> = {
  marija: {
    id: 'marija',
    accountId: 'marija',
    displayName: 'Marija',
    email: 'marija@app.local',
    photoURL: '/assets/images/mock/avatar/avatar-24.webp',
    role: 'admin',
  },
  aco: {
    id: 'aco',
    accountId: 'aco',
    displayName: 'Aco',
    email: 'aco@app.local',
    photoURL: '/assets/images/mock/avatar/avatar-23.webp',
    role: 'admin',
  },
};

