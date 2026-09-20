import { Router } from 'express';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { TOPIC_STATUSES } from '../domain/constants.js';
import { changeTopicStatus } from '../services/topicService.js';
import { asyncHandler, requireFields, badRequest, notFound, toInt } from '../utils/http.js';

/** Subject CRUD + topic status updates (used by Dashboard / Subjects / Chapters). */
export function subjectRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(subjectRepo.listByUser(getUserId(req)));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      const userId = getUserId(req);
      requireFields(req.body, ['name']);
      const created = subjectRepo.create({
        userId,
        name: String(req.body.name).trim(),
        nameBn: req.body.nameBn ?? null,
        code: req.body.code ?? null,
        color: req.body.color ?? undefined,
        icon: req.body.icon ?? undefined,
      });
      activityRepo.record({
        userId,
        type: 'subject_created',
        subjectId: created.id,
        message: `নতুন subject যোগ হয়েছে: ${created.name}`,
      });
      res.status(201).json(created);
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const updated = subjectRepo.update(id, {
        name: req.body.name?.trim(),
        nameBn: req.body.nameBn,
        code: req.body.code,
        color: req.body.color,
        icon: req.body.icon,
        orderIndex: req.body.orderIndex,
        isArchived: req.body.isArchived,
      });
      if (!updated) throw notFound('Subject not found');
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const exists = subjectRepo.findById(id);
      if (!exists) throw notFound('Subject not found');
      subjectRepo.remove(id);
      activityRepo.record({
        userId: getUserId(req),
        type: 'subject_deleted',
        message: `Subject delete হয়েছে: ${exists.name}`,
      });
      res.status(204).end();
    })
  );

  // ---- chapters that belong to a subject (simple list, no progress) ------
  router.get(
    '/:id/chapters',
    asyncHandler(async (req, res) => {
      res.json(chapterRepo.listBySubject(toInt(req.params.id, 'id')));
    })
  );

  // ---- topics of a whole subject (used by quick pickers) -----------------
  router.get(
    '/:id/topics',
    asyncHandler(async (req, res) => {
      res.json(topicRepo.listTree(getUserId(req)).filter((t) => t.subjectId === toInt(req.params.id, 'id')));
    })
  );

  // ---- bulk: mark every topic of a chapter with one status ---------------
  router.patch(
    '/:subjectId/chapters/:chapterId/status',
    asyncHandler(async (req, res) => {
      const { status } = req.body ?? {};
      if (!TOPIC_STATUSES.includes(status)) throw badRequest(`status must be one of ${TOPIC_STATUSES.join(', ')}`);
      const chapterId = toInt(req.params.chapterId, 'chapterId');
      const topics = topicRepo.listByChapter(chapterId);
      for (const topic of topics) changeTopicStatus(topic.id, status, getUserId(req));
      res.json({ updated: topics.length, status });
    })
  );

  return router;
}
