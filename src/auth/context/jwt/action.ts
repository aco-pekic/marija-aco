import { setSession } from './utils';

// ----------------------------------------------------------------------

export type SignInParams = {
  password: string;
  email?: string;
};

export type SignUpParams = {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
};

/** **************************************
 * Sign in
 *************************************** */
export const signInWithPassword = async ({ password }: SignInParams): Promise<void> => {
  const normalizedPassword = password.trim().toLowerCase();

  if (normalizedPassword === 'marija' || normalizedPassword === 'aco') {
    await setSession(normalizedPassword);
    return;
  }

  throw new Error('Wrong password. Use "marija" or "aco".');
};

/** **************************************
 * Sign up
 *************************************** */
export const signUp = async (_params: SignUpParams): Promise<void> => {
  throw new Error('Sign up is disabled. Use password "marija" or "aco" on sign in.');
};

/** **************************************
 * Sign out
 *************************************** */
export const signOut = async (): Promise<void> => {
  await setSession(null);
};
