import { Router } from 'express';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { asyncHandler, requireFields, notFound, toInt } from '../utils/http.js';

/** Chapter CRUD. */
export function chapterRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const subjectId = req.query.subjectId ? toInt(req.query.subjectId, 'subjectId') : null;
      if (subjectId) return res.json(chapterRepo.listBySubject(subjectId));
      const subjects = subjectRepo.listByUser(getUserId(req));
      res.json(subjects.flatMap((s) => chapterRepo.listBySubject(s.id)));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['subjectId', 'name']);
      const subjectId = toInt(req.body.subjectId, 'subjectId');
      const subject = subjectRepo.findById(subjectId);
      if (!subject) throw notFound('Subject not found');

      const created = chapterRepo.create({
        subjectId,
        name: String(req.body.name).trim(),
        nameBn: req.body.nameBn ?? null,
        number: req.body.number !== undefined ? toInt(req.body.number, 'number') : undefined,
        notes: req.body.notes ?? null,
      });
      activityRepo.record({
        userId: getUserId(req),
        type: 'chapter_created',
        subjectId,
        chapterId: created.id,
        message: `নতুন chapter যোগ হয়েছে: ${subject.name} → Chapter ${created.number}: ${created.name}`,
      });
      res.status(201).json(created);
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const updated = chapterRepo.update(toInt(req.params.id, 'id'), {
        name: req.body.name?.trim(),
        nameBn: req.body.nameBn,
        notes: req.body.notes,
        number: req.body.number !== undefined ? toInt(req.body.number, 'number') : undefined,
        orderIndex: req.body.orderIndex,
      });
      if (!updated) throw notFound('Chapter not found');
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const chapter = chapterRepo.findById(id);
      if (!chapter) throw notFound('Chapter not found');
      chapterRepo.remove(id); // topics removed by ON DELETE CASCADE
      activityRepo.record({
        userId: getUserId(req),
        type: 'chapter_deleted',
        message: `Chapter delete হয়েছে: ${chapter.name}`,
      });
      res.status(204).end();
    })
  );

  // topics of one chapter (with progress fields) — handy for the Chapters page
  router.get(
    '/:id/topics',
    asyncHandler(async (req, res) => {
      res.json(topicRepo.listByChapter(toInt(req.params.id, 'id')));
    })
  );

  return router;
}
