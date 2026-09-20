import { Router } from 'express';
import { noteRepo } from '../repositories/noteRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { asyncHandler, requireFields, notFound, toInt } from '../utils/http.js';

/** Personal + AI notes. Both live in `notes` but stay separated by `source`. */
export function noteRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const userId = getUserId(req);
      if (req.query.topicId) {
        return res.json(noteRepo.listByTopic(toInt(req.query.topicId, 'topicId'), req.query.source));
      }
      res.json(noteRepo.listByUser(userId));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['topicId', 'body']);
      const topicId = toInt(req.body.topicId, 'topicId');
      const topic = topicRepo.findById(topicId);
      if (!topic) throw notFound('Topic not found');

      const created = noteRepo.create({
        topicId,
        userId: getUserId(req),
        source: req.body.source === 'ai' ? 'ai' : 'personal',
        title: req.body.title ?? null,
        body: String(req.body.body),
      });
      if (created.source === 'personal') {
        activityRepo.record({
          userId: getUserId(req),
          type: 'note_added',
          topicId,
          message: `নোট যোগ হয়েছে: "${topic.name}"`,
        });
      }
      res.status(201).json(created);
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const updated = noteRepo.update(toInt(req.params.id, 'id'), {
        title: req.body.title,
        body: req.body.body,
      });
      if (!updated) throw notFound('Note not found');
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const removed = noteRepo.remove(toInt(req.params.id, 'id'));
      if (!removed) throw notFound('Note not found');
      res.status(204).end();
    })
  );

  return router;
}
