import dayjs from 'dayjs';

export const RELATIONSHIP_START_DATE = '2025-03-22';

export const RELATIONSHIP_START = dayjs(RELATIONSHIP_START_DATE);

export function formatRelationshipDate() {
  return RELATIONSHIP_START.format('DD . MM . YYYY');
}

export function getRelationshipProgressParts(toDate: dayjs.ConfigType) {
  const target = dayjs(toDate);

  if (!target.isValid()) {
    return {
      days: 0,
      months: 0,
      years: 0,
      totalSeconds: 0,
      label: 'Neispravan datum',
      compactLabel: '0 dana',
    };
  }

  const safeTarget = target.isBefore(RELATIONSHIP_START) ? RELATIONSHIP_START : target;
  const years = safeTarget.diff(RELATIONSHIP_START, 'year');
  const months = safeTarget.diff(RELATIONSHIP_START.add(years, 'year'), 'month');
  const days = safeTarget.diff(RELATIONSHIP_START, 'day');
  const totalSeconds = safeTarget.diff(RELATIONSHIP_START, 'second');

  return {
    years,
    months,
    days,
    totalSeconds,
    compactLabel: `${days} dana`,
  };
}

export function getLiveRelationshipCounterParts(now = dayjs()) {
  const safeNow = now.isBefore(RELATIONSHIP_START) ? RELATIONSHIP_START : now;
  const totalDays = safeNow.diff(RELATIONSHIP_START, 'day');
  const totalHours = safeNow.diff(RELATIONSHIP_START, 'hour');
  const totalMinutes = safeNow.diff(RELATIONSHIP_START, 'minute');
  const totalSeconds = safeNow.diff(RELATIONSHIP_START, 'second');

  const hours = totalHours % 24;
  const minutes = totalMinutes % 60;
  const seconds = totalSeconds % 60;

  return {
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds,
    hours,
    minutes,
    seconds,
  };
}
