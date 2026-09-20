import { Router } from 'express';
import {
  listQuizzes,
  createQuiz,
  getQuiz,
  updateQuiz,
  deleteQuiz,
  addQuestion,
  updateQuestion,
  deleteQuestion,
  attemptQuiz,
  listResults,
  getResult,
  selfMarkResult,
  quizSummary,
  weakTopics,
} from '../services/quizService.js';
import { asyncHandler, toInt } from '../utils/http.js';

/**
 * Quiz system (Phase 3).
 *   GET    /api/quizzes                        all quizzes + quiz summary
 *   POST   /api/quizzes                        create a quiz for a chapter
 *   GET    /api/quizzes/:id                    quiz + questions (answers hidden!)
 *   PATCH  /api/quizzes/:id                    rename / move to another chapter
 *   DELETE /api/quizzes/:id
 *   POST   /api/quizzes/:id/questions          add a question
 *   PATCH  /api/quizzes/:id/questions/:qid     edit a question
 *   DELETE /api/quizzes/:id/questions/:qid     delete a question
 *   POST   /api/quizzes/:id/attempt            submit answers -> score + weak topics
 *
 *   GET    /api/quiz-results                   attempt history + accuracy summary
 *   GET    /api/quiz-results/weak-topics       measured weak topics
 *   GET    /api/quiz-results/:id               one attempt, with review
 *   PATCH  /api/quiz-results/:id/self-mark     mark short/viva answers yourself
 */
export function quizRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(listQuizzes(getUserId(req)));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      res.status(201).json(createQuiz(getUserId(req), req.body ?? {}));
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      // ?answers=1 is for the question editor only — never used while taking a quiz
      res.json(
        getQuiz(getUserId(req), toInt(req.params.id, 'id'), {
          includeAnswers: req.query.answers === '1' || req.query.answers === 'true',
        })
      );
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(updateQuiz(getUserId(req), toInt(req.params.id, 'id'), req.body ?? {}));
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteQuiz(getUserId(req), toInt(req.params.id, 'id'));
      res.status(204).end();
    })
  );

  router.post(
    '/:id/questions',
    asyncHandler(async (req, res) => {
      res.status(201).json(addQuestion(getUserId(req), toInt(req.params.id, 'id'), req.body ?? {}));
    })
  );

  router.patch(
    '/:id/questions/:questionId',
    asyncHandler(async (req, res) => {
      res.json(
        updateQuestion(
          getUserId(req),
          toInt(req.params.id, 'id'),
          toInt(req.params.questionId, 'questionId'),
          req.body ?? {}
        )
      );
    })
  );

  router.delete(
    '/:id/questions/:questionId',
    asyncHandler(async (req, res) => {
      deleteQuestion(
        getUserId(req),
        toInt(req.params.id, 'id'),
        toInt(req.params.questionId, 'questionId')
      );
      res.status(204).end();
    })
  );

  router.post(
    '/:id/attempt',
    asyncHandler(async (req, res) => {
      res.status(201).json(attemptQuiz(getUserId(req), toInt(req.params.id, 'id'), req.body ?? {}));
    })
  );

  return router;
}

/** Attempt history, weak topics and self-marking live under their own path. */
export function quizResultRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(listResults(getUserId(req), req.query.limit));
    })
  );

  router.get(
    '/weak-topics',
    asyncHandler(async (req, res) => {
      res.json({ weakTopics: weakTopics(getUserId(req)), summary: quizSummary(getUserId(req)) });
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(getResult(getUserId(req), toInt(req.params.id, 'id')));
    })
  );

  router.patch(
    '/:id/self-mark',
    asyncHandler(async (req, res) => {
      res.json(selfMarkResult(getUserId(req), toInt(req.params.id, 'id'), req.body ?? {}));
    })
  );

  return router;
}
