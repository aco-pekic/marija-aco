export type NumberLocale = {
  code: string;
  currency: string;
};

// Minimal placeholder for number formatting.
// Apps that support locale switching can replace this with a real implementation.
export function formatNumberLocale(): NumberLocale | null {
  return null;
}

