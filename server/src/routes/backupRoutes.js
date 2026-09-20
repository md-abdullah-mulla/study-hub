import { Router } from 'express';
import {
  backupStatus,
  createBackup,
  autoBackupIfDue,
  listBackups,
  getBackup,
  deleteBackup,
  restoreBackupById,
  BACKUP_RETENTION,
} from '../services/backupService.js';
import { asyncHandler, toInt } from '../utils/http.js';

/**
 * Auto backup (Phase 5).
 *
 *   GET    /api/backups                snapshots + status (last backup time, is one due?)
 *   GET    /api/backups/status         just the status
 *   POST   /api/backups                take a snapshot now (body: { kind, label })
 *   POST   /api/backups/auto           take one only if it is due (used when the app opens)
 *   GET    /api/backups/:id            one snapshot, payload included (for download)
 *   POST   /api/backups/:id/restore    restore it (body: { confirm: true })
 *   DELETE /api/backups/:id
 *
 * The payload is exactly what Settings → "Backup (JSON)" downloads, so a file
 * backup and an automatic snapshot are interchangeable.
 */
export function backupRouter({ getUserId }) {
  const router = Router();

  router.get(
    '/',
    asyncHandler(async (req, res) => {
      res.json({ ...listBackups(getUserId(req)), retention: BACKUP_RETENTION });
    })
  );

  router.get(
    '/status',
    asyncHandler(async (req, res) => {
      res.json({ ...backupStatus(getUserId(req)), retention: BACKUP_RETENTION });
    })
  );

  router.post(
    '/',
    asyncHandler(async (req, res) => {
      res.status(201).json(createBackup(getUserId(req), { kind: req.body?.kind, label: req.body?.label }));
    })
  );

  router.post(
    '/auto',
    asyncHandler(async (req, res) => {
      res.json(autoBackupIfDue(getUserId(req)));
    })
  );

  router.get(
    '/:id',
    asyncHandler(async (req, res) => {
      res.json(getBackup(getUserId(req), toInt(req.params.id, 'id')));
    })
  );

  router.post(
    '/:id/restore',
    asyncHandler(async (req, res) => {
      res.json(
        restoreBackupById(getUserId(req), toInt(req.params.id, 'id'), { confirm: Boolean(req.body?.confirm) })
      );
    })
  );

  router.delete(
    '/:id',
    asyncHandler(async (req, res) => {
      deleteBackup(getUserId(req), toInt(req.params.id, 'id'));
      res.status(204).end();
    })
  );

  return router;
}
