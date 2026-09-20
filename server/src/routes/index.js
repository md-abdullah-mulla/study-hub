import { Router } from 'express';
import { buildProgressTree } from '../services/progressService.js';
import { buildDashboard } from '../services/dashboardService.js';
import { globalSearch } from '../services/searchService.js';
import { parseImportText, applyImport } from '../services/importService.js';
import { buildBackup, topicsToCsv } from '../services/exportService.js';
import { statusRouter } from './statusRoutes.js';
import { subjectRouter } from './subjectRoutes.js';
import { chapterRouter } from './chapterRoutes.js';
import { topicRouter } from './topicRoutes.js';
import { noteRouter } from './noteRoutes.js';
import { planRouter } from './planRoutes.js';
import { sessionRouter } from './sessionRoutes.js';
import { STATUS_LABELS_BN, IMPORTANCE } from '../domain/constants.js';
import { asyncHandler } from '../utils/http.js';

export function apiRouter({ getUserId }) {
  const router = Router();

  // ---- meta (labels used by the UI) --------------------------------------
  router.get(
    '/meta',
    asyncHandler(async (_req, res) => {
      res.json({
        appName: 'Smart Semester Study Manager',
        semester: 6,
        program: 'Diploma in Computer Science & Technology',
        topicStatusLabels: STATUS_LABELS_BN,
        importanceLevels: IMPORTANCE,
        phase: 2,
      });
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
  router.use('/notes', noteRouter({ getUserId }));
  router.use('/plan', planRouter({ getUserId }));
  router.use('/sessions', sessionRouter({ getUserId }));

  return router;
}
