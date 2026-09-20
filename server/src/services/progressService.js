import { topicRepo } from '../repositories/topicRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { daysSince, isDue } from '../utils/date.js';

/**
 * PROGRESS ENGINE — the single source of truth.
 * Rule (spec §28): percentages are ALWAYS derived from topic data, never typed by hand.
 */

/**
 * A topic counts towards progress when it is completed.
 * "Needs revision" keeps the earlier completion (revision is a stage after
 * finishing, not a reset) — otherwise progress would drop unfairly.
 * Topics with no topics at all are simply ignored by the maths below.
 */
export function isTopicDone(topic) {
  if (topic.status === 'completed') return true;
  return topic.status === 'needs_revision' && Boolean(topic.completedAt);
}

export function percent(done, total) {
  if (!total) return 0;
  return Math.round((done / total) * 100);
}

export function summarize(topics) {
  const stats = {
    total: topics.length,
    completed: 0,
    studying: 0,
    notStarted: 0,
    needsRevision: 0,
  };
  for (const t of topics) {
    if (isTopicDone(t)) stats.completed += 1;
    if (t.status === 'studying') stats.studying += 1;
    if (t.status === 'not_started') stats.notStarted += 1;
    if (t.status === 'needs_revision') stats.needsRevision += 1;
  }
  return { ...stats, remaining: stats.total - stats.completed, percent: percent(stats.completed, stats.total) };
}

/** Is this topic waiting for a revision right now? */
export function isRevisionDue(topic) {
  if (topic.status === 'needs_revision') return true;
  if (topic.status !== 'completed') return false;
  return isDue(topic.nextRevisionAt);
}

export function lastStudiedAt(topics) {
  const dates = topics.map((t) => t.lastStudiedAt).filter(Boolean).sort();
  return dates.length ? dates[dates.length - 1] : null;
}

/**
 * Builds Subject -> Chapter -> Topic structure enriched with progress.
 * Every level uses the same rule: completed topics / total topics.
 */
export function buildProgressTree(userId) {
  const subjects = subjectRepo.listByUser(userId);
  const topics = topicRepo.listTree(userId);

  const topicsByChapter = new Map();
  for (const topic of topics) {
    const list = topicsByChapter.get(topic.chapterId) ?? [];
    list.push({ ...topic, isDone: isTopicDone(topic), revisionDue: isRevisionDue(topic) });
    topicsByChapter.set(topic.chapterId, list);
  }

  const result = [];
  const allTopics = [];

  for (const subject of subjects) {
    const chapters = chapterRepo.listBySubject(subject.id).map((chapter) => {
      const chapterTopics = topicsByChapter.get(chapter.id) ?? [];
      return { ...chapter, topics: chapterTopics, progress: summarize(chapterTopics) };
    });

    const subjectTopics = chapters.flatMap((c) => c.topics);
    allTopics.push(...subjectTopics);

    result.push({
      ...subject,
      chapters,
      progress: summarize(subjectTopics),
      lastStudiedAt: lastStudiedAt(subjectTopics),
      revisionDueCount: subjectTopics.filter((t) => t.revisionDue).length,
    });
  }

  const semester = {
    progress: summarize(allTopics),
    totalChapters: result.reduce((n, s) => n + s.chapters.length, 0),
    completedChapters: result.reduce(
      (n, s) => n + s.chapters.filter((c) => c.progress.total > 0 && c.progress.percent === 100).length,
      0
    ),
    startedChapters: result.reduce(
      (n, s) => n + s.chapters.filter((c) => c.progress.completed > 0).length,
      0
    ),
    revisionDueCount: allTopics.filter((t) => t.revisionDue).length,
  };
  semester.remainingChapters = semester.totalChapters - semester.completedChapters;

  return { subjects: result, semester };
}

/** List of topics waiting for revision, most overdue first. */
export function revisionQueue(subjects, limit = 20) {
  const queue = [];
  for (const subject of subjects) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        if (!topic.revisionDue) continue;
        queue.push({
          topicId: topic.id,
          topicName: topic.name,
          topicNameBn: topic.nameBn,
          subjectId: subject.id,
          subjectName: subject.name,
          subjectColor: subject.color,
          chapterId: chapter.id,
          chapterName: chapter.name,
          chapterNumber: chapter.number,
          dueAt: topic.nextRevisionAt,
          overdueDays: topic.nextRevisionAt ? daysSince(topic.nextRevisionAt) : 0,
          stage: topic.revisionStage,
        });
      }
    }
  }
  return queue
    .sort((a, b) => b.overdueDays - a.overdueDays || a.topicId - b.topicId)
    .slice(0, limit);
}
