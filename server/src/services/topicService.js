import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { TOPIC_STATUSES, STATUS_LABELS_BN } from '../domain/constants.js';
import { REVISION_INTERVALS_DAYS } from '../config.js';
import { addDays, nowIso } from '../utils/date.js';
import { badRequest, notFound } from '../utils/http.js';

/**
 * All topic status rules in one place, so "completed", revision dates and
 * timestamps can never disagree with each other.
 */
export function applyStatusChange(topic, nextStatus) {
  if (!TOPIC_STATUSES.includes(nextStatus)) {
    throw badRequest(`status must be one of: ${TOPIC_STATUSES.join(', ')}`);
  }
  const now = nowIso();
  const patch = { status: nextStatus };

  if (nextStatus === 'not_started') {
    patch.startedAt = null;
    patch.completedAt = null;
    patch.revisionStage = 'none';
    patch.nextRevisionAt = null;
  }

  if (nextStatus === 'studying') {
    patch.startedAt = topic.startedAt ?? now;
    patch.completedAt = null;
    patch.lastStudiedAt = now;
  }

  if (nextStatus === 'completed') {
    patch.startedAt = topic.startedAt ?? now;
    patch.completedAt = topic.completedAt ?? now;
    patch.lastStudiedAt = now;
    if (!topic.revisionStage || topic.revisionStage === 'none') {
      patch.revisionStage = 'learned';
      patch.nextRevisionAt = addDays(patch.completedAt, REVISION_INTERVALS_DAYS.learned);
    }
  }

  if (nextStatus === 'needs_revision') {
    // keeps completed_at: the topic stays counted as done, but is flagged
    patch.nextRevisionAt = now;
  }

  return patch;
}

export function changeTopicStatus(topicId, status, userId) {
  const topic = topicRepo.findById(topicId);
  if (!topic) throw notFound('Topic not found');

  const updated = topicRepo.update(topicId, applyStatusChange(topic, status));
  const chapter = chapterRepo.findById(topic.chapterId);
  const subject = chapter ? subjectRepo.findById(chapter.subjectId) : null;

  activityRepo.record({
    userId,
    type: 'topic_status_changed',
    subjectId: subject?.id ?? null,
    chapterId: chapter?.id ?? null,
    topicId: topic.id,
    message: `${subject?.name ?? 'Subject'} → Chapter ${chapter?.number ?? ''} → "${topic.name}" — ${STATUS_LABELS_BN[status]}`,
    meta: { from: topic.status, to: status },
  });

  return updated;
}

export function markRevisionDone(topicId, userId) {
  const topic = topicRepo.findById(topicId);
  if (!topic) throw notFound('Topic not found');

  const stages = ['learned', 'revision_1', 'revision_2', 'final'];
  const currentIndex = stages.indexOf(topic.revisionStage === 'none' ? 'learned' : topic.revisionStage);
  const nextStage = stages[Math.min(currentIndex + 1, stages.length - 1)];
  const now = nowIso();
  const interval = REVISION_INTERVALS_DAYS[nextStage];

  const updated = topicRepo.update(topicId, {
    status: nextStage === 'final' ? 'completed' : 'needs_revision',
    revisionStage: nextStage,
    revisionCount: (topic.revisionCount ?? 0) + 1,
    lastRevisionAt: now,
    nextRevisionAt: interval === null || interval === undefined ? null : addDays(now, interval),
    lastStudiedAt: now,
  });

  activityRepo.record({
    userId,
    type: 'revision_done',
    chapterId: topic.chapterId,
    topicId,
    message: `Revision completed: "${topic.name}" (${nextStage.replace('_', ' ')})`,
    meta: { stage: nextStage },
  });

  return updated;
}
