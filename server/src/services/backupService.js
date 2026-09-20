import { backupRepo } from '../repositories/backupRepo.js';
import { buildBackup } from './exportService.js';
import { restoreBackup } from './restoreService.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { notFound, badRequest } from '../utils/http.js';

/**
 * Auto backup (Phase 5).
 *
 * Why it exists: the Semester 6 data (progress, notes, quiz and exam results)
 * lives in a database the student cannot see. Losing it means losing weeks of
 * work, so a snapshot is taken automatically and the last few are kept.
 *
 * Rules:
 *  - a snapshot is "due" when the newest one is older than `DUE_AFTER_HOURS`
 *  - an automatic snapshot can never destroy anything: it only adds a row and
 *    then trims the OLDEST autos, keeping the newest `KEEP_AUTO`
 *  - restoring first takes a safety snapshot ("restore-এর আগের অবস্থা"), so a
 *    wrong restore is always undoable
 */
const DUE_AFTER_HOURS = 12;
const KEEP_AUTO = 5;
const KEEP_MANUAL = 10;

const hoursSince = (iso) => {
  if (!iso) return Number.POSITIVE_INFINITY;
  return (Date.now() - new Date(iso).getTime()) / 36e5;
};

export function backupStatus(userId) {
  const latestAny = backupRepo.latest(userId);
  const latestAuto = backupRepo.latest(userId, 'auto');
  return {
    lastBackupAt: latestAny?.createdAt ?? null,
    lastAutoBackupAt: latestAuto?.createdAt ?? null,
    hoursSinceLastBackup: Number.isFinite(hoursSince(latestAny?.createdAt)) ? Math.round(hoursSince(latestAny?.createdAt)) : null,
    dueAfterHours: DUE_AFTER_HOURS,
    isDue: hoursSince(latestAny?.createdAt) >= DUE_AFTER_HOURS,
    autoCount: backupRepo.listByUser(userId, 100).filter((row) => row.kind === 'auto').length,
    totalCount: backupRepo.listByUser(userId, 100).length,
  };
}

export function createBackup(userId, { kind = 'manual', label } = {}) {
  const payload = JSON.stringify(buildBackup(userId));
  const snapshot = backupRepo.create({
    userId,
    kind: kind === 'auto' ? 'auto' : 'manual',
    label: label?.trim() || (kind === 'auto' ? 'Auto backup' : 'Manual backup'),
    payload,
  });

  backupRepo.trim(userId, 'auto', KEEP_AUTO);
  backupRepo.trim(userId, 'manual', KEEP_MANUAL);

  activityRepo.record({
    userId,
    type: 'backup_created',
    message: `${kind === 'auto' ? 'Auto' : 'Manual'} backup নেওয়া হলো (${Math.round(snapshot.sizeBytes / 1024)} KB)`,
  });

  return { ...snapshot, status: backupStatus(userId) };
}

/** Called by the app when it opens; does nothing when a fresh backup exists. */
export function autoBackupIfDue(userId) {
  const status = backupStatus(userId);
  if (!status.isDue) return { created: false, status };
  const snapshot = createBackup(userId, { kind: 'auto', label: 'Auto backup (app খোলার সময়)' });
  return { created: true, snapshot, status: snapshot.status };
}

export function listBackups(userId) {
  return { backups: backupRepo.listByUser(userId, 30), status: backupStatus(userId) };
}

export function getBackup(userId, id) {
  const snapshot = backupRepo.findWithPayload(id);
  if (!snapshot || snapshot.userId !== userId) throw notFound('Backup not found');
  return snapshot;
}

export function deleteBackup(userId, id) {
  const snapshot = backupRepo.findMeta(id);
  if (!snapshot || snapshot.userId !== userId) throw notFound('Backup not found');
  return backupRepo.remove(id);
}

/**
 * Restores a snapshot. Because this replaces the current data it is guarded by
 * `confirm: true` from the UI, and the state before restoring is snapshotted
 * first (so the restore itself can be undone).
 */
export function restoreBackupById(userId, id, { confirm = false } = {}) {
  if (!confirm) throw badRequest('Restore করতে confirm দরকার — এটা বর্তমান data বদলে দেবে');
  const snapshot = backupRepo.findWithPayload(id);
  if (!snapshot || snapshot.userId !== userId) throw notFound('Backup not found');

  const safety = createBackup(userId, { kind: 'manual', label: 'Restore-এর আগের অবস্থা' });
  const parsed = JSON.parse(snapshot.payload);
  const result = restoreBackup(userId, parsed);

  activityRepo.record({
    userId,
    type: 'backup_restored',
    message: `Backup থেকে data ফিরিয়ে আনা হলো (${snapshot.label})`,
  });

  return { restored: result, safetySnapshotId: safety.id, from: snapshot.label, createdAt: snapshot.createdAt };
}

export const BACKUP_RETENTION = { auto: KEEP_AUTO, manual: KEEP_MANUAL, dueAfterHours: DUE_AFTER_HOURS };
