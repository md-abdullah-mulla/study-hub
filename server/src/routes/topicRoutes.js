import { Router } from 'express';
import { topicRepo } from '../repositories/topicRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { noteRepo } from '../repositories/noteRepo.js';
import { changeTopicStatus, markRevisionDone } from '../services/topicService.js';
import { illustrationPrompt, listIllustrationTypes } from '../services/illustrationPromptService.js';
import { IMPORTANCE } from '../domain/constants.js';
import { asyncHandler, requireFields, badRequest, notFound, toInt } from '../utils/http.js';

/** Topic CRUD, status change and revision actions. */
export function topicRouter({ getUserId }) {
  const router = Router();

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['chapterId', 'name']);
      const chapterId = toInt(req.body.chapterId, 'chapterId');
      const chapter = chapterRepo.findById(chapterId);
      if (!chapter) throw notFound('Chapter not found');
      if (req.body.importance && !IMPORTANCE.includes(req.body.importance)) {
        throw badRequest(`importance must be one of ${IMPORTANCE.join(', ')}`);
      }

      const created = topicRepo.create({
        chapterId,
        name: String(req.body.name).trim(),
        nameBn: req.body.nameBn ?? null,
        description: req.body.description ?? null,
        importance: req.body.importance ?? 'medium',
      });
      res.status(201).json(created);
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      const topic = topicRepo.findById(toInt(req.params.id, 'id'));
      if (!topic) throw notFound('Topic not found');
      const chapter = chapterRepo.findById(topic.chapterId);
      const subject = subjectRepo.findById(chapter.subjectId);
      res.json({
        ...topic,
        chapter,
        subject,
        personalNotes: noteRepo.listByTopic(topic.id, 'personal'),
        aiNotes: noteRepo.listByTopic(topic.id, 'ai'),
      });
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const topic = topicRepo.findById(id);
      if (!topic) throw notFound('Topic not found');
      if (req.body.importance && !IMPORTANCE.includes(req.body.importance)) {
        throw badRequest(`importance must be one of ${IMPORTANCE.join(', ')}`);
      }
      const updated = topicRepo.update(id, {
        name: req.body.name?.trim(),
        nameBn: req.body.nameBn,
        description: req.body.description,
        importance: req.body.importance,
        confidence:
          req.body.confidence === null || req.body.confidence === undefined
            ? undefined
            : toInt(req.body.confidence, 'confidence'),
        orderIndex: req.body.orderIndex,
      });
      res.json(updated);
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const id = toInt(req.params.id, 'id');
      const topic = topicRepo.findById(id);
      if (!topic) throw notFound('Topic not found');
      topicRepo.remove(id);
      res.status(204).end();
    })
  );

  // ---- progress actions --------------------------------------------------
  router.patch(
    '/:id/status',
    asyncHandler(async (req, res) => {
      requireFields(req.body, ['status']);
      const userId = getUserId(req);
      const updated = changeTopicStatus(toInt(req.params.id, 'id'), req.body.status, userId);
      res.json(updated);
    })
  );

  router.post(
    '/:id/revision/complete',
    asyncHandler(async (req, res) => {
      res.json(markRevisionDone(toInt(req.params.id, 'id'), getUserId(req)));
    })
  );

  // ---- reorder topics inside a chapter (drag & drop later) ---------------
  router.patch(
    '/reorder/bulk',
    asyncHandler(async (req, res) => {
      const ids = Array.isArray(req.body?.topicIds) ? req.body.topicIds : null;
      if (!ids) throw badRequest('topicIds array is required');
      const userId = getUserId(req);
      ids.forEach((topicId, index) => {
        const topic = topicRepo.findById(toInt(topicId, 'topicId'));
        if (!topic) return;
        topicRepo.update(topic.id, { orderIndex: index });
      });
      activityRepo.record({
        userId,
        type: 'topics_reordered',
        message: `${ids.length}টি topic-এর order আপডেট হয়েছে`,
      });
      res.json({ updated: ids.length });
    })
  );

  /**
   * AI illustration prompt (Phase 4). Builds a ready-to-paste image prompt from
   * this topic's own data — no AI API and no API key involved.
   */
  router.post(
    '/:id/illustration-prompt',
    asyncHandler(async (req, res) => {
      res.json(
        illustrationPrompt(getUserId(req), toInt(req.params.id, 'id'), {
          type: req.body?.type,
          variant: req.body?.variant,
        })
      );
    })
  );

  return router;
}

/** The illustration types the prompt generator supports. */
export function illustrationTypeRouter() {
  const router = Router();
  router.get(
    '/types',
    asyncHandler(async (_req, res) => {
      res.json(listIllustrationTypes());
    })
  );
  return router;
}
