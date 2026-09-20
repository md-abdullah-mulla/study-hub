import { Router } from 'express';
import { buildProgressTree, revisionQueue } from '../services/progressService.js';
import { asyncHandler } from '../utils/http.js';

/**
 * Read-only helpers around topic statuses: counts per status and the
 * revision queue. Kept tiny so the dashboard stays fast.
 */
export function statusRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/summary',
    asyncHandler(async (req, res) => {
      const tree = buildProgressTree(getUserId(req));
      const allTopics = tree.subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics));
      const byStatus = { not_started: 0, studying: 0, completed: 0, needs_revision: 0 };
      for (const t of allTopics) byStatus[t.status] += 1;
      res.json({ ...tree.semester.progress, byStatus });
    })
  );

  router.get(
    '/revision-queue',
    asyncHandler(async (req, res) => {
      const tree = buildProgressTree(getUserId(req));
      res.json(revisionQueue(tree.subjects, Number(req.query.limit ?? 20)));
    })
  );

  return router;
}
