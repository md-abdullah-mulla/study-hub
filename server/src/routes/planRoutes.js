import { Router } from 'express';
import { planRepo } from '../repositories/planRepo.js';
import { buildProgressTree } from '../services/progressService.js';
import { generatePlan } from '../services/plannerService.js';
import { todayLocalDate } from '../utils/date.js';
import { asyncHandler, requireFields, notFound, toInt } from '../utils/http.js';

/** Today's study plan: auto-generated, user editable. */
export function planRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const planDate = typeof req.query.date === 'string' ? req.query.date : todayLocalDate();
      res.json(planRepo.listByDate(getUserId(req), planDate));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['title']);
      const userId = getUserId(req);
      const created = planRepo.create({
        userId,
        planDate: req.body.planDate ?? todayLocalDate(),
        subjectId: req.body.subjectId ?? null,
        chapterId: req.body.chapterId ?? null,
        topicId: req.body.topicId ?? null,
        kind: req.body.kind === 'revision' ? 'revision' : 'study',
        title: String(req.body.title).trim(),
        source: 'user',
      });
      res.status(201).json(created);
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const item = planRepo.findById(id);
      if (!item) throw notFound('Plan item not found');

      // one response per request: tick and/or rename, then return the stored row
      const updated = planRepo.update(id, {
        isDone: req.body.isDone === undefined ? undefined : Boolean(req.body.isDone),
        title: req.body.title === undefined ? undefined : String(req.body.title).trim(),
      });
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const removed = planRepo.remove(toInt(req.params.id, 'id'));
      if (!removed) throw notFound('Plan item not found');
      res.status(204).end();
    })
  );

  /** Rebuild today's plan from the latest progress data. */
  router.post(
    '/regenerate',
    asyncHandler(async (req, res) => {
      const userId = getUserId(req);
      const planDate = req.body?.planDate ?? todayLocalDate();
      const tree = buildProgressTree(userId);
      res.json(generatePlan({ userId, tree, planDate, force: true }));
    })
  );

  return router;
}
