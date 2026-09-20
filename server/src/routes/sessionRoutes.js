import { Router } from 'express';
import {
  startSession,
  finishSession,
  getSession,
  openSessions,
  listSessions,
  deleteSession,
} from '../services/sessionService.js';
import { asyncHandler, toInt, notFound } from '../utils/http.js';

/**
 * Study Session Tracker (Phase 2) — the timer writes here.
 *   POST   /api/sessions        start a sitting
 *   PATCH  /api/sessions/:id    finish it (duration, confidence, note, revision flag)
 *   GET    /api/sessions        history + study-time summary (today / streak / per subject)
 *   GET    /api/sessions/active sittings that were never finished
 */
export function sessionRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json(listSessions(getUserId(req), req.query));
    })
  );

  router.get(
    '/active',
    asyncHandler(async (req, res) => {
      res.json(openSessions(getUserId(req)));
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      res.status(201).json(startSession(getUserId(req), req.body ?? {}));
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(getSession(getUserId(req), toInt(req.params.id, 'id')));
    })
  );

  router.patch(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(finishSession(getUserId(req), toInt(req.params.id, 'id'), req.body ?? {}));
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      const removed = deleteSession(getUserId(req), toInt(req.params.id, 'id'));
      if (!removed) throw notFound('Study session not found');
      res.status(204).end();
    })
  );

  return router;
}
