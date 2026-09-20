import { buildProgressTree, revisionQueue } from './progressService.js';
import { recommendNext } from './recommendationService.js';
import { generatePlan } from './plannerService.js';
import { buildStudyStats } from './statsService.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { planRepo } from '../repositories/planRepo.js';
import { todayLocalDate } from '../utils/date.js';

/**
 * DASHBOARD PAYLOAD (spec §9, §32)
 * The dashboard only receives what it shows first:
 *   1 overall progress  2 subject progress  3 today's plan
 *   4 what to study next (with reasons)     5 revision due  6 recent activity
 * Everything heavier lives on /api/analytics.
 */
export function buildDashboard(userId, { planDate = todayLocalDate() } = {}) {
  const tree = buildProgressTree(userId);
  const revisionList = revisionQueue(tree.subjects, 20);
  const recommendation = recommendNext(tree, revisionList);

  // keep today's plan in sync with the current data, then read it back
  generatePlan({ userId, tree, planDate });
  const plan = planRepo.listByDate(userId, planDate);

  const stats = buildStudyStats(userId);
  const subjects = [...tree.subjects].sort((a, b) => a.orderIndex - b.orderIndex || a.id - b.id);

  return {
    date: planDate,
    overall: {
      percent: tree.semester.progress.percent,
      completedTopics: tree.semester.progress.completed,
      totalTopics: tree.semester.progress.total,
      remainingTopics: tree.semester.progress.remaining,
      completedChapters: tree.semester.completedChapters,
      totalChapters: tree.semester.totalChapters,
      remainingChapters: tree.semester.remainingChapters,
      totalSubjects: subjects.length,
      revisionDueCount: tree.semester.revisionDueCount,
    },
    stats: {
      totalSubjects: subjects.length,
      totalChapters: tree.semester.totalChapters,
      completedChapters: tree.semester.completedChapters,
      remainingChapters: tree.semester.remainingChapters,
      completedTopics: tree.semester.progress.completed,
      remainingTopics: tree.semester.progress.remaining,
      totalStudyMinutes: stats.totalMinutes,
      todayStudyMinutes: stats.todayMinutes,
      currentStreak: stats.currentStreak,
      // the dashboard shows "সেরা: X দিন" next to the streak — without this the
      // card printed "undefined" (the analytics page already had it)
      longestStreak: stats.longestStreak,
    },
    subjects: subjects.map((s) => ({
      id: s.id,
      name: s.name,
      nameBn: s.nameBn,
      code: s.code,
      color: s.color,
      progress: s.progress,
      lastStudiedAt: s.lastStudiedAt,
      revisionDueCount: s.revisionDueCount,
      chapterCount: s.chapters.length,
      completedChapters: s.chapters.filter((c) => c.progress.total > 0 && c.progress.percent === 100).length,
    })),
    todayPlan: plan,
    recommendation,
    revisionDue: revisionList.slice(0, 5),
    recentActivity: activityRepo.listRecent(userId, 6),
  };
}
