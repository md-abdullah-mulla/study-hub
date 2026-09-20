import { Router } from 'express';
import { buildProgressTree } from '../services/progressService.js';
import { buildStudyStats } from '../services/statsService.js';
import { buildDashboard } from '../services/dashboardService.js';
import { globalSearch } from '../services/searchService.js';
import { parseImportText, applyImport } from '../services/importService.js';
import { buildBackup, topicsToCsv } from '../services/exportService.js';
import { buildAdvancedAnalytics } from '../services/advancedAnalyticsService.js';
import { statusRouter } from './statusRoutes.js';
import { subjectRouter } from './subjectRoutes.js';
import { chapterRouter } from './chapterRoutes.js';
import { topicRouter, illustrationTypeRouter } from './topicRoutes.js';
import { noteRouter } from './noteRoutes.js';
import { planRouter } from './planRoutes.js';
import { sessionRouter } from './sessionRoutes.js';
import { quizRouter, quizResultRouter } from './quizRoutes.js';
import { studyContentRouter } from './contentRoutes.js';
import { examRouter } from './examRoutes.js';
import { backupRouter } from './backupRoutes.js';
import { STATUS_LABELS_BN, IMPORTANCE } from '../domain/constants.js';
import { ILLUSTRATION_TYPES } from '../services/illustration/promptBuilder.js';
import { userRepo } from '../repositories/userRepo.js';
import { asyncHandler, requireFields } from '../utils/http.js';

export function apiRouter({ getUserId }) {
  const router = Router();

  // ---- meta (labels used by the UI) --------------------------------------
  router.get(
    '/meta',
    asyncHandler(async (req, res) => {
      res.json({
        appName: 'Smart Semester Study Manager',
        semester: 6,
        program: 'Diploma in Computer Science & Technology',
        topicStatusLabels: STATUS_LABELS_BN,
        importanceLevels: IMPORTANCE,
        illustrationTypes: ILLUSTRATION_TYPES,
        studentName: userRepo.findById(getUserId(req))?.name ?? 'Student',
        phase: 2,
      });
    })
  );

  // ---- student profile (used by the printable report) --------------------
  router.patch(
    '/profile',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['name']);
      res.json(userRepo.updateName(getUserId(req), String(req.body.name).trim()));
    })
  );

  // ---- dashboard ---------------------------------------------------------
  router.get(
    '/dashboard',
    asyncHandler(async (req, res) => {
      const date = typeof req.query.date === 'string' ? req.query.date : undefined;
      res.json(buildDashboard(getUserId(req), { ...(date ? { planDate: date } : {}) }));
    })
  );

  // ---- full progress tree (used by Subjects / Chapters pages) ------------
  router.get(
    '/progress-tree',
    asyncHandler(async (req, res) => {
      res.json(buildProgressTree(getUserId(req)));
    })
  );

  // ---- advanced analytics (Phase 5: performance, trends, insights) --------
  router.get(
    '/analytics/advanced',
    asyncHandler(async (req, res) => {
      res.json(buildAdvancedAnalytics(getUserId(req)));
    })
  );

  // ---- study analytics (Phase 2: real timer data only) -------------------
  router.get(
    '/analytics',
    asyncHandler(async (req, res) => {
      res.json(buildStudyStats(getUserId(req)));
    })
  );

  // ---- search ------------------------------------------------------------
  router.get(
    '/search',
    asyncHandler(async (req, res) => {
      res.json(globalSearch(getUserId(req), req.query.q));
    })
  );

  // ---- import chapter (parse preview + apply) ----------------------------
  router.post(
    '/import/parse',
    asyncHandler(async (req, res) => {
      res.json(parseImportText(req.body?.text));
    })
  );

  router.post(
    '/import/apply',
    asyncHandler(async (req, res) => {
      res.status(201).json(applyImport(getUserId(req), req.body ?? {}));
    })
  );

  // ---- export / backup ---------------------------------------------------
  router.get(
    '/export/backup',
    asyncHandler(async (req, res) => {
      res.setHeader('Content-Disposition', 'attachment; filename="study-backup.json"');
      res.json(buildBackup(getUserId(req)));
    })
  );

  router.get(
    '/export/topics.csv',
    asyncHandler(async (req, res) => {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="topics.csv"');
      res.send(topicsToCsv(getUserId(req)));
    })
  );

  router.use('/statuses', statusRouter({ getUserId }));
  router.use('/subjects', subjectRouter({ getUserId }));
  router.use('/chapters', chapterRouter({ getUserId }));
  router.use('/topics', topicRouter({ getUserId }));
  router.use('/illustration', illustrationTypeRouter());
  router.use('/notes', noteRouter({ getUserId }));
  router.use('/plan', planRouter({ getUserId }));
  router.use('/sessions', sessionRouter({ getUserId }));
  router.use('/quizzes', quizRouter({ getUserId }));
  router.use('/quiz-results', quizResultRouter({ getUserId }));
  router.use('/study-content', studyContentRouter({ getUserId }));
  router.use('/exams', examRouter({ getUserId }));
  router.use('/backups', backupRouter({ getUserId }));

  return router;
}
