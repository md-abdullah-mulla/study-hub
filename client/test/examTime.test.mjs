import { test } from 'node:test';
import assert from 'node:assert/strict';
import { examDeadlineMs, examSecondsLeft, examElapsedSeconds, formatClock } from '../src/lib/examTime.js';

/**
 * The exam clock must come from the exam's own start time, so a page refresh
 * cannot hand out a fresh countdown (and the auto-submit sends the answers the
 * student really gave — see ExamRunner).
 */
const startedAt = '2026-09-20T10:00:00.000Z';
const exam = { startedAt, durationMinutes: 15, endsAt: '2026-09-20T10:15:00.000Z' };

test('the countdown follows the exam start time, not the moment the page opened', () => {
  const threeMinutesIn = new Date('2026-09-20T10:03:00.000Z').getTime();
  assert.equal(examSecondsLeft(exam, threeMinutesIn), 12 * 60, '12 minutes left after 3 minutes');
  assert.equal(examElapsedSeconds(exam, threeMinutesIn), 3 * 60);

  const fourMinutesLater = new Date('2026-09-20T10:07:00.000Z').getTime();
  assert.equal(examSecondsLeft(exam, fourMinutesLater), 8 * 60, 'the clock kept running while away');
});

test('the deadline is derived from startedAt when the server sends no endsAt', () => {
  const withoutEndsAt = { startedAt, durationMinutes: 30 };
  assert.equal(examDeadlineMs(withoutEndsAt) - new Date(startedAt).getTime(), 30 * 60_000);
});

test('time over is clamped to zero, never negative', () => {
  const longAfter = new Date('2026-09-20T12:00:00.000Z').getTime();
  assert.equal(examSecondsLeft(exam, longAfter), 0);
  assert.equal(examElapsedSeconds(exam, longAfter), 15 * 60, 'elapsed never exceeds the duration');
});

test('a missing exam never returns a negative or NaN clock', () => {
  assert.ok(examSecondsLeft(null, Date.now()) >= 0);
  assert.equal(formatClock(examSecondsLeft(undefined)), '00:00');
});

test('the clock is formatted as MM:SS', () => {
  assert.equal(formatClock(0), '00:00');
  assert.equal(formatClock(59), '00:59');
  assert.equal(formatClock(872), '14:32');
  assert.equal(formatClock(-5), '00:00');
});
