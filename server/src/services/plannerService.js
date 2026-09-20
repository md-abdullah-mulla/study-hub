import { planRepo } from '../repositories/planRepo.js';
import { recommendNext } from './recommendationService.js';
import { revisionQueue } from './progressService.js';
import { todayLocalDate } from '../utils/date.js';

/**
 * TODAY'S STUDY PLAN (spec §11)
 * Generated from real data, then saved as editable rows so the user can
 * tick / remove / add items during the day.
 */
const MAX_ITEMS = 3;

function nextChapterOf(subject) {
  const pending = subject.chapters
    .filter((c) => c.progress.percent < 100 && c.progress.total > 0)
    .sort((a, b) => a.number - b.number);
  const inProgress = pending.find((c) => c.progress.completed > 0 || c.progress.studying > 0);
  return inProgress ?? pending[0] ?? null;
}

/**
 * Build (and store) today's plan. Returns the stored rows.
 * Auto-generation happens only ONCE per day: after that the user owns the
 * list (they can delete items without the dashboard bringing them back).
 * The "Regenerate" button clears today's auto items and rebuilds.
 */
export function generatePlan({ userId, tree, planDate = todayLocalDate(), force = false }) {
  if (!force && planRepo.countAuto(userId, planDate) > 0) {
    return planRepo.listByDate(userId, planDate);
  }
  if (force) planRepo.clearAuto(userId, planDate);

  const revisionList = revisionQueue(tree.subjects, 10);
  const candidates = [];

  // 1) revision first if anything is due
  if (revisionList[0]) {
    const r = revisionList[0];
    candidates.push({
      subjectId: r.subjectId,
      chapterId: r.chapterId,
      kind: 'revision',
      title: `Revision — ${r.subjectName} → Chapter ${r.chapterNumber}: ${r.chapterName}`,
    });
  }

  // 2) the recommended next study
  const recommendation = recommendNext(tree, revisionList);
  if (recommendation?.chapterId && recommendation.kind !== 'revision') {
    candidates.push({
      subjectId: recommendation.subjectId,
      chapterId: recommendation.chapterId,
      kind: 'study',
      title: `${recommendation.subjectName} → Chapter ${recommendation.chapterNumber}: ${recommendation.chapterName}`,
    });
  }

  // 3) second priority subject, so one subject never eats the whole day
  const usedSubjects = new Set(candidates.map((c) => c.subjectId));
  for (const subject of [...tree.subjects].sort(
    (a, b) => a.progress.percent - b.progress.percent || a.id - b.id
  )) {
    if (candidates.length >= MAX_ITEMS) break;
    if (usedSubjects.has(subject.id)) continue;
    const chapter = nextChapterOf(subject);
    if (!chapter) continue;
    candidates.push({
      subjectId: subject.id,
      chapterId: chapter.id,
      kind: 'study',
      title: `${subject.name} → Chapter ${chapter.number}: ${chapter.name}`,
    });
    usedSubjects.add(subject.id);
  }

  for (const item of candidates.slice(0, MAX_ITEMS)) {
    const already = planRepo.existsAutoItem(userId, planDate, item.chapterId, item.kind);
    if (already) continue;
    planRepo.create({ userId, planDate, ...item, source: 'auto' });
  }

  return planRepo.listByDate(userId, planDate);
}
