import { studySessionRepo } from '../repositories/studySessionRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { changeTopicStatus } from './topicService.js';
import { buildStudyStats } from './statsService.js';
import { nowIso } from '../utils/date.js';
import { badRequest, notFound } from '../utils/http.js';

/**
 * Study Session Tracker (Phase 2).
 *
 * A session is one sitting: start -> finish. Only real, measured time is ever
 * stored (duration comes from the clock unless the student types a value), so
 * the dashboard's "study time" and streak can never be faked.
 */
export const MAX_SESSION_MINUTES = 12 * 60; // a sitting longer than 12h is a mis-click
const MAX_LIST_LIMIT = 200;

const toOptionalId = (value, field) => {
  if (value === undefined || value === null || value === '') return null;
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw badRequest(`${field} must be a positive integer`);
  return n;
};

const toIsoOrNow = (value, field) => {
  if (value === undefined || value === null || value === '') return nowIso();
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw badRequest(`${field} must be a valid date`);
  return parsed.toISOString();
};

const toConfidence = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw badRequest('confidence must be a whole number from 1 to 5');
  }
  return n;
};

const toTopicsCompleted = (value) => {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw badRequest('topicsCompleted must be 0 or more');
  return n;
};

const minutesBetween = (startIso, endIso) =>
  Math.min(MAX_SESSION_MINUTES, Math.max(0, Math.round((new Date(endIso) - new Date(startIso)) / 60000)));

const resolvePlacement = ({ subjectId, chapterId, topicId }) => {
  // The topic is the most specific thing we know, so it wins: chapter and
  // subject are derived from it instead of trusting three separate values.
  if (topicId) {
    const topic = topicRepo.findById(topicId);
    if (!topic) throw notFound('Topic not found');
    const chapter = chapterRepo.findById(topic.chapterId);
    if (!chapter) throw notFound('Chapter not found');
    return { subjectId: chapter.subjectId, chapterId: chapter.id, topicId: topic.id };
  }
  if (chapterId) {
    const chapter = chapterRepo.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found');
    return { subjectId: chapter.subjectId, chapterId: chapter.id, topicId: null };
  }
  if (subjectId) {
    const subject = subjectRepo.findById(subjectId);
    if (!subject) throw notFound('Subject not found');
    return { subjectId: subject.id, chapterId: null, topicId: null };
  }
  return { subjectId: null, chapterId: null, topicId: null };
};

export function startSession(userId, body = {}) {
  const placement = resolvePlacement({
    subjectId: toOptionalId(body.subjectId, 'subjectId'),
    chapterId: toOptionalId(body.chapterId, 'chapterId'),
    topicId: toOptionalId(body.topicId, 'topicId'),
  });

  const session = studySessionRepo.create({
    userId,
    ...placement,
    startedAt: toIsoOrNow(body.startedAt, 'startedAt'),
  });

  // The student is studying this topic right now, so a never-touched topic moves
  // to "studying" immediately (it is never auto-marked completed — progress
  // stays something the student decides).
  if (placement.topicId) {
    const topic = topicRepo.findById(placement.topicId);
    if (topic && topic.status === 'not_started') changeTopicStatus(topic.id, 'studying', userId);
  }

  const what = session.topicName ?? session.subjectName ?? 'Study';
  activityRepo.record({
    userId,
    type: 'session_started',
    subjectId: placement.subjectId,
    chapterId: placement.chapterId,
    topicId: placement.topicId,
    message: `Study session started: ${what}`,
    meta: { sessionId: session.id },
  });

  return session;
}

/** Finish a sitting: store the real duration plus how it felt. */
export function finishSession(userId, sessionId, body = {}) {
  const session = studySessionRepo.findById(sessionId);
  if (!session || session.userId !== userId) throw notFound('Study session not found');

  // PATCH edits an existing session — it does not "re-finish" it. So an already
  // stored end time / duration is only replaced when the caller sends one;
  // otherwise a later note edit would silently reset the minutes to the clock.
  const alreadyFinished = Boolean(session.endedAt);
  let endedAt = session.endedAt;
  if (body.endedAt !== undefined && body.endedAt !== null && body.endedAt !== '') {
    endedAt = toIsoOrNow(body.endedAt, 'endedAt');
  } else if (!alreadyFinished) {
    endedAt = nowIso();
  }

  let durationMinutes = alreadyFinished
    ? session.durationMinutes
    : minutesBetween(session.startedAt, endedAt);
  if (body.durationMinutes !== undefined && body.durationMinutes !== null && body.durationMinutes !== '') {
    const typed = Number(body.durationMinutes);
    if (!Number.isInteger(typed) || typed < 0 || typed > MAX_SESSION_MINUTES) {
      throw badRequest(`durationMinutes must be a whole number between 0 and ${MAX_SESSION_MINUTES}`);
    }
    durationMinutes = typed;
  }

  const confidence = toConfidence(body.confidence);
  const topicsCompleted = toTopicsCompleted(body.topicsCompleted);

  const updated = studySessionRepo.update(sessionId, {
    endedAt,
    durationMinutes,
    confidence,
    topicsCompleted,
    revisionNeeded: body.revisionNeeded === undefined ? undefined : Boolean(body.revisionNeeded),
    note: body.note === undefined ? undefined : (String(body.note).trim() || null),
  });

  if (updated.topicId) {
    const topic = topicRepo.findById(updated.topicId);
    if (topic) {
      const patch = { lastStudiedAt: endedAt };
      if (updated.revisionNeeded && topic.status === 'completed') patch.nextRevisionAt = endedAt;
      topicRepo.update(topic.id, patch);
    }
  }

  activityRepo.record({
    userId,
    type: 'study_session',
    subjectId: updated.subjectId,
    chapterId: updated.chapterId,
    topicId: updated.topicId,
    message: `Studied ${updated.topicName ?? updated.subjectName ?? 'a subject'} for ${durationMinutes} min${
      updated.confidence ? ` (confidence ${updated.confidence}/5)` : ''
    }`,
    meta: { sessionId: updated.id, durationMinutes },
  });

  return updated;
}

export function getSession(userId, sessionId) {
  const session = studySessionRepo.findById(sessionId);
  if (!session || session.userId !== userId) throw notFound('Study session not found');
  return session;
}

/** Sessions the student never finished — the timer screen offers to resume them. */
export function openSessions(userId) {
  return studySessionRepo.findOpen(userId);
}

/**
 * History + summary in one call, so the analytics screen does not need a
 * second round trip. `from`/`to` are local 'YYYY-MM-DD' days.
 */
export function listSessions(userId, query = {}) {
  const limit = Math.min(MAX_LIST_LIMIT, Math.max(1, Number(query.limit) || 50));
  const from = typeof query.from === 'string' && query.from ? query.from : null;
  const to = typeof query.to === 'string' && query.to ? query.to : null;

  return {
    sessions: studySessionRepo.listByUser(userId, { limit, from, to }),
    summary: buildStudyStats(userId),
  };
}

export function deleteSession(userId, sessionId) {
  const session = studySessionRepo.findById(sessionId);
  if (!session || session.userId !== userId) throw notFound('Study session not found');
  return studySessionRepo.remove(sessionId);
}
