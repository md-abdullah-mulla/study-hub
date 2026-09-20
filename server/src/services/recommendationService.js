import { REVISION_INTERVALS_DAYS } from '../config.js';
import { daysSince, addDays, nowIso } from '../utils/date.js';

/**
 * SMART RECOMMENDATION ENGINE (spec §10)
 * Deterministic — same data always gives the same answer.
 * Every point of the score has a reason the dashboard can display, so the
 * user is never told "study X" without knowing why.
 */

const WEIGHTS = {
  lowCompletion: 1.0,      // per percent still left
  idleDays: 2.5,           // per day not studied (capped)
  idleDaysCap: 14,
  revisionDue: 4,          // per topic waiting for revision
  neverStudied: 8,         // subject that was never opened
  inProgressBonus: 6,      // finish what you started before starting something new
};

/** Which chapter should be opened next for this subject? */
function pickNextChapter(subject) {
  const chaptersWithWork = subject.chapters.filter((c) => c.progress.percent < 100);

  // 1) an unfinished chapter that is already in progress comes first
  const inProgress = chaptersWithWork
    .filter((c) => c.progress.completed > 0 || c.progress.studying > 0)
    .sort((a, b) => a.number - b.number)[0];
  if (inProgress) {
    return { chapter: inProgress, kind: 'study', because: 'চলমান chapter শেষ করা' };
  }

  // 2) otherwise the lowest numbered chapter that has topics
  const next = chaptersWithWork.filter((c) => c.progress.total > 0).sort((a, b) => a.number - b.number)[0];
  if (next) return { chapter: next, kind: 'study', because: 'পরের chapter শুরু করা' };

  // 3) empty chapter (no topics yet) — tell the user to add topics instead
  const empty = subject.chapters.sort((a, b) => a.number - b.number)[0];
  if (empty) return { chapter: empty, kind: 'add_topics', because: 'এই chapter-এ এখনো topic যোগ করা হয়নি' };
  return null;
}

/** Chapter-level first topic that is not done yet. */
function pickNextTopic(chapter) {
  if (!chapter) return null;
  return (
    chapter.topics.find((t) => t.status === 'studying') ??
    chapter.topics.find((t) => t.status === 'needs_revision') ??
    chapter.topics.find((t) => !t.isDone) ??
    null
  );
}

export function scoreSubject(subject, revisionQueueForSubject) {
  const percentLeft = 100 - subject.progress.percent;
  const idle = subject.lastStudiedAt ? daysSince(subject.lastStudiedAt) : null;

  const score =
    percentLeft * WEIGHTS.lowCompletion +
    Math.min(idle ?? WEIGHTS.idleDaysCap, WEIGHTS.idleDaysCap) * WEIGHTS.idleDays +
    subject.revisionDueCount * WEIGHTS.revisionDue +
    (!subject.lastStudiedAt && subject.progress.total > 0 ? WEIGHTS.neverStudied : 0) +
    (subject.progress.studying > 0 ? WEIGHTS.inProgressBonus : 0);

  return { score: Math.round(score * 10) / 10, percentLeft, idle };
}

function buildReasons(subject, revisionQueueForSubject) {
  const reasons = [];
  const { percentLeft, idle } = scoreSubject(subject, revisionQueueForSubject);
  const remainingChapters = subject.chapters.filter((c) => c.progress.percent < 100).length;

  reasons.push({
    label: 'কম completion',
    value: `${subject.progress.percent}% শেষ (${percentLeft}% বাকি)`,
  });

  if (subject.progress.total === 0) {
    reasons.push({ label: '⚠️ কোনো topic নেই', value: 'এই subject-এ topic যোগ করুন' });
  } else if (idle === null) {
    reasons.push({ label: 'এখনো পড়া হয়নি', value: 'একবারও study session নেই' });
  } else if (idle === 0) {
    reasons.push({ label: 'আজ পড়া হয়েছে', value: 'আজই শেষবার পড়েছেন' });
  } else {
    reasons.push({ label: 'পড়া হয়নি', value: `${idle} দিন` });
  }

  if (remainingChapters > 0) {
    reasons.push({ label: 'বাকি chapter', value: `${remainingChapters}টি` });
  }
  if (subject.revisionDueCount > 0) {
    reasons.push({ label: 'Revision due', value: `${subject.revisionDueCount}টি topic` });
  }
  if (subject.progress.studying > 0) {
    reasons.push({ label: 'চলমান topic', value: `${subject.progress.studying}টি` });
  }
  return reasons;
}

/**
 * @param {object} tree  result of buildProgressTree()
 * @param {Array}  revisionList result of revisionQueue()
 * @returns recommendation | null  (null = everything is finished)
 */
export function recommendNext(tree, revisionList = []) {
  const candidates = tree.subjects
    .filter((s) => s.progress.total > 0 && s.progress.percent < 100)
    .map((subject) => {
      const subjectRevision = revisionList.filter((r) => r.subjectId === subject.id);
      const { score } = scoreSubject(subject, subjectRevision);
      return { subject, score };
    })
    .sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const [best, second] = candidates;
  const next = pickNextChapter(best.subject);
  const revisionFirst = revisionList.find((r) => r.subjectId === best.subject.id);
  const topic = pickNextTopic(next?.chapter);

  return {
    subjectId: best.subject.id,
    subjectName: best.subject.name,
    subjectNameBn: best.subject.nameBn,
    subjectColor: best.subject.color,
    percent: best.subject.progress.percent,
    score: best.score,
    chapterId: next?.chapter?.id ?? null,
    chapterName: next?.chapter?.name ?? null,
    chapterNumber: next?.chapter?.number ?? null,
    chapterPercent: next?.chapter?.progress?.percent ?? null,
    topicId: topic?.id ?? null,
    topicName: topic?.name ?? null,
    kind: revisionFirst && (next?.kind !== 'add_topics') ? 'revision' : next?.kind ?? 'study',
    revisionTopic: revisionFirst ?? null,
    reasons: buildReasons(best.subject, []),
    runnerUp: second
      ? {
          subjectId: second.subject.id,
          subjectName: second.subject.name,
          subjectColor: second.subject.color,
          percent: second.subject.progress.percent,
          score: second.score,
        }
      : null,
  };
}

/** Next revision stage + due date for a topic that just got completed. */
export function nextRevisionPlan(stage) {
  const days = REVISION_INTERVALS_DAYS[stage];
  if (days === null || days === undefined) return { nextStage: 'final', nextRevisionAt: null };
  return { nextStage: stage, nextRevisionAt: addDays(nowIso(), days) };
}
