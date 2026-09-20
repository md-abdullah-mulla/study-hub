/**
 * Exam clock helpers (pure functions — easy to test, no React inside).
 *
 * Why this exists: the countdown used to start from `durationMinutes * 60`
 * every time the screen mounted, so refreshing the page (or coming back to a
 * running exam) silently handed the student a brand-new full countdown. A timed
 * exam must not do that. The deadline is now derived from the exam's own
 * `startedAt` (server clock), so the time keeps running whether the page stays
 * open or not.
 */

/** When this exam has to be submitted (ms since epoch). */
export function examDeadlineMs(exam) {
  if (!exam) return Date.now();
  if (exam.endsAt) {
    const parsed = new Date(exam.endsAt).getTime();
    if (Number.isFinite(parsed)) return parsed;
  }
  const started = exam.startedAt ? new Date(exam.startedAt).getTime() : Date.now();
  const safeStart = Number.isFinite(started) ? started : Date.now();
  return safeStart + Number(exam.durationMinutes ?? 0) * 60_000;
}

/** Seconds left before the exam is over (never negative). */
export function examSecondsLeft(exam, now = Date.now()) {
  return Math.max(0, Math.round((examDeadlineMs(exam) - now) / 1000));
}

/** Seconds the student has already spent inside this exam. */
export function examElapsedSeconds(exam, now = Date.now()) {
  const total = Math.max(0, Number(exam?.durationMinutes ?? 0) * 60);
  return Math.min(total, total - examSecondsLeft(exam, now));
}

/** "09:07" style clock from a number of seconds. */
export function formatClock(totalSeconds) {
  const safe = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, '0')}:${String(safe % 60).padStart(2, '0')}`;
}
