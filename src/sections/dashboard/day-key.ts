export const DASHBOARD_TIME_ZONE = 'Europe/Belgrade';

function getPart(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes) {
  return parts.find((part) => part.type === type)?.value;
}

export function getDayKeyInTimeZone(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = getPart(parts, 'year');
  const month = getPart(parts, 'month');
  const day = getPart(parts, 'day');

  if (!year || !month || !day) {
    throw new Error('Could not resolve local date parts');
  }

  return `${year}-${month}-${day}`;
}

export function getDashboardDayKey(date = new Date()) {
  return getDayKeyInTimeZone(DASHBOARD_TIME_ZONE, date);
}

