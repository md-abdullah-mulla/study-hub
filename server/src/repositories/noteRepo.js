import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

export const noteRepo = {
  listByTopic(topicId, source) {
    const rows = source
      ? db
          .prepare(
            'SELECT * FROM notes WHERE topic_id = ? AND source = ? ORDER BY updated_at DESC'
          )
          .all(topicId, source)
      : db
          .prepare('SELECT * FROM notes WHERE topic_id = ? ORDER BY source, updated_at DESC')
          .all(topicId);
    return camelAll(rows);
  },

  listByUser(userId) {
    return camelAll(
      db
        .prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY updated_at DESC')
        .all(userId)
    );
  },

  findById(id) {
    return camel(db.prepare('SELECT * FROM notes WHERE id = ?').get(id));
  },

  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO notes (topic_id, user_id, source, title, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.topicId,
        data.userId,
        data.source ?? 'personal',
        data.title ?? null,
        data.body,
        now,
        now
      );
    return noteRepo.findById(info.lastInsertRowid);
  },

  update(id, patch) {
    const current = noteRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare('UPDATE notes SET title = ?, body = ?, updated_at = ? WHERE id = ?').run(
      merged.title ?? null,
      merged.body,
      nowIso(),
      id
    );
    return noteRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM notes WHERE id = ?').run(id).changes > 0;
  },
};
