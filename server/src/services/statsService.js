import { studySessionRepo } from '../repositories/studySessionRepo.js';
import { todayLocalDate } from '../utils/date.js';

function dayBefore(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/** Consecutive study days ending today (or yesterday, if today is not studied yet). */
export function currentStreak(days) {
  const set = new Set(days.map((d) => d.day));
  const today = todayLocalDate();
  let cursor = set.has(today) ? today : dayBefore(today);
  if (!set.has(cursor)) return 0;
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = dayBefore(cursor);
  }
  return streak;
}

export function longestStreak(days) {
  const sorted = [...new Set(days.map((d) => d.day))].sort();
  let best = 0;
  let run = 0;
  let previous = null;
  for (const day of sorted) {
    run = previous && dayBefore(day) === previous ? run + 1 : 1;
    previous = day;
    best = Math.max(best, run);
  }
  return best;
}

/** Study-time numbers used by the dashboard. */
export function buildStudyStats(userId) {
  const byDay = studySessionRepo.minutesByLocalDate(userId);
  const totalMinutes = studySessionRepo.totalMinutes(userId);
  const today = todayLocalDate();

  return {
    totalMinutes,
    todayMinutes: byDay.find((d) => d.day === today)?.minutes ?? 0,
    currentStreak: currentStreak(byDay),
    longestStreak: longestStreak(byDay),
    activeDays: byDay.length,
    byDay,
    bySubject: studySessionRepo.minutesBySubject(userId),
  };
}
