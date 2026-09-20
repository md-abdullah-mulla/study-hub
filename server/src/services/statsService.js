import { studySessionRepo } from '../repositories/studySessionRepo.js';
import { todayLocalDate } from '../utils/date.js';

/** Consecutive study days ending today (or yesterday, if today is not studied yet). */
function shiftDay(dateStr, delta) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

const dayBefore = (dateStr) => shiftDay(dateStr, -1);

const WEEKDAY_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

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

/** The last 7 local days, gaps filled with 0 so the chart never lies by omission. */
export function last7Days(days) {
  const minutesByDay = new Map(days.map((d) => [d.day, d.minutes]));
  const today = todayLocalDate();
  return Array.from({ length: 7 }, (_, index) => {
    const day = shiftDay(today, index - 6);
    const weekday = new Date(`${day}T00:00:00Z`).getUTCDay();
    return {
      day,
      label: WEEKDAY_BN[weekday],
      isToday: day === today,
      minutes: minutesByDay.get(day) ?? 0,
    };
  });
}

/**
 * Study-time numbers used by the dashboard and the analytics page.
 *
 * Everything here is derived from stored sessions, so a number can only exist
 * if the timer actually recorded it. Before any study: zeros and `null`s —
 * never a made-up "most studied subject".
 */
export function buildStudyStats(userId) {
  const byDay = studySessionRepo.minutesByLocalDate(userId);
  const totalMinutes = studySessionRepo.totalMinutes(userId);
  const today = todayLocalDate();
  const week = last7Days(byDay);
  const sessionCount = byDay.reduce((sum, day) => sum + (day.sessions ?? 0), 0);
  const finishedCount = studySessionRepo.finishedSessionCount(userId);

  const bySubject = studySessionRepo.minutesBySubject(userId).map((row) => ({
    ...row,
    sharePercent: totalMinutes ? Math.round((row.minutes / totalMinutes) * 100) : 0,
  }));

  const studied = bySubject.filter((row) => row.minutes > 0);
  const sortedByMinutes = [...bySubject].sort((a, b) => a.minutes - b.minutes || a.subjectName.localeCompare(b.subjectName));

  return {
    totalMinutes,
    todayMinutes: byDay.find((d) => d.day === today)?.minutes ?? 0,
    weekMinutes: week.reduce((sum, day) => sum + day.minutes, 0),
    currentStreak: currentStreak(byDay),
    longestStreak: longestStreak(byDay),
    activeDays: byDay.length,
    sessionCount,
    averageSessionMinutes: finishedCount ? Math.round(totalMinutes / finishedCount) : 0,
    byDay,
    last7Days: week,
    bySubject,
    // only meaningful once something has actually been studied
    mostStudied: studied[0] ? { subjectId: studied[0].subjectId, name: studied[0].subjectName, minutes: studied[0].minutes } : null,
    leastStudied: totalMinutes
      ? {
          subjectId: sortedByMinutes[0].subjectId,
          name: sortedByMinutes[0].subjectName,
          minutes: sortedByMinutes[0].minutes,
        }
      : null,
  };
}
