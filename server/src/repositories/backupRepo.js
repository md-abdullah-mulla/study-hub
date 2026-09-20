import { db } from '../db/connection.js';
import { camel, camelAll } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * Rolling backup snapshots. The heavy column (`payload`) is only selected when
 * it is really needed, so listing snapshots stays cheap.
 */
export const backupRepo = {
  create({ userId, kind = 'auto', label, payload }) {
    const info = db
      .prepare(
        'INSERT INTO backups (user_id, kind, label, size_bytes, payload, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .run(userId, kind, label, Buffer.byteLength(payload, 'utf8'), payload, nowIso());
    return backupRepo.findMeta(info.lastInsertRowid);
  },

  listByUser(userId, limit = 20) {
    return camelAll(
      db
        .prepare(
          `SELECT id, user_id, kind, label, size_bytes, created_at
             FROM backups WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`
        )
        .all(userId, limit)
    );
  },

  findMeta(id) {
    return camel(
      db.prepare('SELECT id, user_id, kind, label, size_bytes, created_at FROM backups WHERE id = ?').get(id)
    );
  },

  findWithPayload(id) {
    return camel(db.prepare('SELECT * FROM backups WHERE id = ?').get(id));
  },

  latest(userId, kind = null) {
    const row = kind
      ? db.prepare('SELECT * FROM backups WHERE user_id = ? AND kind = ? ORDER BY id DESC LIMIT 1').get(userId, kind)
      : db.prepare('SELECT * FROM backups WHERE user_id = ? ORDER BY id DESC LIMIT 1').get(userId);
    return camel(row);
  },

  count(userId) {
    return db.prepare('SELECT COUNT(*) AS total FROM backups WHERE user_id = ?').get(userId).total;
  },

  /** Keeps only the newest `keep` snapshots of this kind (auto backups are rolling). */
  trim(userId, kind, keep) {
    const stale = db
      .prepare(
        `SELECT id FROM backups WHERE user_id = ? AND kind = ?
          ORDER BY created_at DESC, id DESC LIMIT -1 OFFSET ?`
      )
      .all(userId, kind, keep);
    for (const row of stale) db.prepare('DELETE FROM backups WHERE id = ?').run(row.id);
    return stale.length;
  },

  remove(id) {
    return db.prepare('DELETE FROM backups WHERE id = ?').run(id).changes > 0;
  },
};
