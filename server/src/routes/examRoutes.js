import { Router } from 'express';
import {
  createExam,
  getExam,
  submitExam,
  listExams,
  deleteExam,
  examStats,
  examAvailability,
} from '../services/examService.js';
import { asyncHandler, toInt } from '../utils/http.js';

/**
 * Exam Mode (Phase 5) — timed exams with automatic grading.
 * No AI API is used; questions come from the student's quiz bank plus the
 * pattern-based MCQs of the study-content generator.
 *
 *   GET    /api/exams                      past exams + exam statistics
 *   GET    /api/exams/stats                exam statistics only
 *   GET    /api/exams/availability         how many questions a scope has
 *   POST   /api/exams                      start an exam
 *   GET    /api/exams/:id                  exam questions (answers hidden until submitted)
 *   POST   /api/exams/:id/submit           grade the exam, get the review
 *   DELETE /api/exams/:id                  delete an exam attempt
 */
export function examRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      const userId = getUserId(req);
      res.json({ exams: listExams(userId, req.query.limit), stats: examStats(userId) });
    })
  );

  router.get(
    '/stats',
    asyncHandler(async (req, res) => {
      res.json(examStats(getUserId(req)));
    })
  );

  router.get(
    '/availability',
    asyncHandler(async (req, res) => {
      res.json(
        examAvailability(getUserId(req), {
          subjectId: req.query.subjectId ? toInt(req.query.subjectId, 'subjectId') : undefined,
          chapterId: req.query.chapterId ? toInt(req.query.chapterId, 'chapterId') : undefined,
          topicId: req.query.topicId ? toInt(req.query.topicId, 'topicId') : undefined,
        })
      );
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      res.status(201).json(createExam(getUserId(req), req.body ?? {}));
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(getExam(getUserId(req), toInt(req.params.id, 'id')));
    })
  );

  router.post(
    '/:id/submit',
    asyncHandler(async (req, res) => {
      res.json(
        submitExam(getUserId(req), toInt(req.params.id, 'id'), {
          answers: req.body?.answers ?? {},
          timeTakenSeconds: req.body?.timeTakenSeconds,
        })
      );
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteExam(getUserId(req), toInt(req.params.id, 'id'));
      res.status(204).end();
    })
  );

  return router;
}
