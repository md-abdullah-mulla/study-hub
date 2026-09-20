import { api } from '../api/client.js';
import { isLocalApiMode } from './env.js';

/**
 * AUTO BACKUP (Phase 5).
 *
 * The Semester 6 data is the student's real work, so it is protected twice:
 *
 *  1. **Snapshots** — the same JSON the "Backup (JSON)" download produces,
 *     stored through `/api/backups`. This works in every mode, because the
 *     browser build (GitHub Pages / Vercel) runs the very same routes inside the
 *     page. From here the student can list, download, restore and delete.
 *  2. **Recovery copies** (browser mode only) — the raw database file is copied
 *     into IndexedDB under its own keys. A snapshot stored *inside* a damaged
 *     database would be useless, so these extra copies are what makes recovery
 *     possible when the database itself cannot be opened.
 *
 * Nothing here throws: every call returns `{ ok, ... }` or `{ ok: false, error }`,
 * so the UI can always show an honest success/failure state.
 */
const SNAPSHOT_PREFIX = 'recovery-';
const KEEP_RECOVERY_COPIES = 3;

const storage = () => globalThis.__STUDY_HUB_STORAGE__ ?? globalThis.studyHubLocal?.storage ?? null;
const backend = () => globalThis.studyHubLocal?.backend ?? globalThis.__OFFLINE_BACKEND__ ?? null;

export const isBrowserMode = () => isLocalApiMode || Boolean(backend());

/** ---------- status ---------- */

export async function backupStatus() {
  try {
    const status = await api.backups.status();
    return {
      ...status,
      mode: isBrowserMode() ? 'browser' : 'server',
      recoveryCopies: isBrowserMode() ? listRecoveryCopies().length : 0,
    };
  } catch (error) {
    return { mode: isBrowserMode() ? 'browser' : 'server', error: error.message, isDue: false, lastBackupAt: null };
  }
}

/** ---------- taking a backup ---------- */

export async function backupNow({ kind = 'manual', label } = {}) {
  try {
    const snapshot = await api.backups.create(kind, label);
    const result = { ok: true, id: snapshot.id, createdAt: snapshot.createdAt, sizeBytes: snapshot.sizeBytes, mode: 'server' };

    if (isBrowserMode()) {
      // the corruption-proof copy: the database file itself, outside the database
      const local = storage();
      const database = backend();
      if (local?.set && database?.exportBytes) {
        const key = `${SNAPSHOT_PREFIX}${snapshot.createdAt}`;
        await local.set(key, database.exportBytes());
        registerRecoveryCopy(key, snapshot.createdAt);
        pruneRecoveryCopies();
        result.mode = 'browser';
        result.recoveryCopies = listRecoveryCopies().length;
      } else if (!local) {
        result.warning = 'IndexedDB বন্ধ থাকায় আলাদা recovery copy রাখা গেল না';
      }
    }

    return result;
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** Called when the app opens; does nothing while a fresh snapshot exists. */
export async function autoBackupIfDue() {
  try {
    const response = await api.backups.autoIfDue();
    if (!response.created) return { ok: true, created: false, status: response.status };
    // an automatic snapshot also deserves a recovery copy
    const again = await backupNow({ kind: 'auto', label: response.snapshot?.label });
    return { ok: true, created: true, snapshot: response.snapshot, local: again };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** ---------- listing / restoring / deleting ---------- */

export async function listSnapshots() {
  try {
    const data = await api.backups.list();
    return {
      snapshots: data.backups,
      status: data.status,
      retention: data.retention,
      mode: isBrowserMode() ? 'browser' : 'server',
      recoveryCopies: listRecoveryCopies(),
    };
  } catch (error) {
    return { snapshots: [], error: error.message, mode: isBrowserMode() ? 'browser' : 'server' };
  }
}

export async function restoreSnapshot(id) {
  try {
    // a copy of the current state is taken by the server before it replaces anything
    const result = await api.backups.restore(id);
    return { ok: true, restored: result.restored, safetySnapshotId: result.safetySnapshotId, reloadRequired: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function deleteSnapshot(id) {
  try {
    await api.backups.remove(id);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

export async function downloadSnapshot(id) {
  try {
    const snapshot = await api.backups.get(id);
    const blob = new Blob([snapshot.payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `study-backup-${(snapshot.createdAt ?? '').slice(0, 10) || 'snapshot'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    return { ok: true, fileName: link.download };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

/** ---------- recovery when the database file itself is damaged ---------- */

export function listRecoveryCopies() {
  return (globalThis.__STUDY_HUB_RECOVERY__ ?? []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function registerRecoveryCopy(key, createdAt) {
  const list = globalThis.__STUDY_HUB_RECOVERY__ ?? [];
  globalThis.__STUDY_HUB_RECOVERY__ = [...list.filter((entry) => entry.key !== key), { key, createdAt }];
}

/** Reads the stored keys once, so an existing copy is found after a reload. */
export async function loadRecoveryCopyIndex(local = storage()) {
  if (!local?.keys) return [];
  const keys = await local.keys();
  const copies = keys
    .filter((key) => String(key).startsWith(SNAPSHOT_PREFIX))
    .map((key) => ({ key, createdAt: String(key).slice(SNAPSHOT_PREFIX.length) }));
  globalThis.__STUDY_HUB_RECOVERY__ = copies;
  return copies;
}

/**
 * Uses the newest recovery copy to bring a database back. Returns the number of
 * bytes restored, so the caller (the recovery screen) knows it worked.
 */
export async function restoreFromRecoveryCopy() {
  const local = storage();
  const database = backend();
  if (!local || !database?.replaceDatabase) return { ok: false, error: 'recovery copy পড়া যাচ্ছে না' };
  await loadRecoveryCopyIndex(local);
  const newest = listRecoveryCopies()[0];
  if (!newest) return { ok: false, error: 'কোনো recovery copy নেই' };
  const bytes = await local.get(newest.key);
  if (!bytes) return { ok: false, error: 'recovery copy খালি' };
  const size = database.replaceDatabase(bytes);
  return { ok: true, sizeBytes: size, createdAt: newest.createdAt };
}

function pruneRecoveryCopies() {
  const copies = listRecoveryCopies();
  const stale = copies.slice(KEEP_RECOVERY_COPIES);
  const local = storage();
  for (const copy of stale) local?.remove?.(copy.key);
  globalThis.__STUDY_HUB_RECOVERY__ = copies.slice(0, KEEP_RECOVERY_COPIES);
  return stale.length;
}

export const BACKUP_KEEP_RECOVERY_COPIES = KEEP_RECOVERY_COPIES;
