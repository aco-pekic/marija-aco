import { AUTH_ACCOUNT_STORAGE_KEY } from './constant';

// ----------------------------------------------------------------------

export type LocalAccountId = 'marija' | 'aco';

const VALID_ACCOUNT_IDS: LocalAccountId[] = ['marija', 'aco'];

export function normalizeAccountId(value: string | null | undefined): LocalAccountId | null {
  if (!value) return null;

  const normalized = value.trim().toLowerCase();

  return VALID_ACCOUNT_IDS.includes(normalized as LocalAccountId)
    ? (normalized as LocalAccountId)
    : null;
}

export function jwtDecode(token: string) {
  const accountId = normalizeAccountId(token);

  if (!accountId) return null;

  return {
    sub: accountId,
    accountId,
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  };
}

export function isValidToken(accessToken: string) {
  return Boolean(normalizeAccountId(accessToken));
}

export function getSessionAccountId() {
  const rawValue = sessionStorage.getItem(AUTH_ACCOUNT_STORAGE_KEY);
  return normalizeAccountId(rawValue);
}

export async function setSession(accessToken: string | null) {
  const accountId = normalizeAccountId(accessToken);

  if (accountId) {
    sessionStorage.setItem(AUTH_ACCOUNT_STORAGE_KEY, accountId);
  } else {
    sessionStorage.removeItem(AUTH_ACCOUNT_STORAGE_KEY);
  }
}
