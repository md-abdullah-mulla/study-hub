/**
 * All date/time helpers live here so timezone logic never gets duplicated.
 * Data is stored in UTC (ISO strings); "today" is calculated in the user's
 * local timezone (Asia/Dhaka, UTC+6, no daylight saving).
 */
export const TZ_OFFSET_MINUTES = 360; // UTC+6

export function nowIso() {
  return new Date().toISOString();
}

export function addDays(dateIso, days) {
  const d = new Date(dateIso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/** 'YYYY-MM-DD' in local (Dhaka) time for any date/ISO string. */
export function toLocalDate(value = new Date()) {
  const d = value instanceof Date ? value : new Date(value);
  const shifted = new Date(d.getTime() + TZ_OFFSET_MINUTES * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
}

export function todayLocalDate() {
  return toLocalDate(new Date());
}

/** Whole days between two ISO strings (always >= 0). */
export function daysBetween(fromIso, toIso = nowIso()) {
  if (!fromIso) return null;
  const diff = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(diff / (24 * 60 * 60 * 1000)));
}

export function daysSince(fromIso) {
  return daysBetween(fromIso, nowIso());
}

/** true when dueIso is null (never) -> false, otherwise due <= now */
export function isDue(dueIso) {
  if (!dueIso) return false;
  return new Date(dueIso).getTime() <= Date.now();
}
