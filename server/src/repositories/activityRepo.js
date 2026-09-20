import { db } from '../db/connection.js';
import { camel, camelAll } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * One place to append to the activity feed.
 * Dashboard "Recent Activity" and later the analytics page read from here.
 */
export const activityRepo = {
  record({ userId, type, message, subjectId = null, chapterId = null, topicId = null, meta = null }) {
    const info = db
      .prepare(
        `INSERT INTO activities
           (user_id, type, subject_id, chapter_id, topic_id, message, meta_json, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        userId,
        type,
        subjectId,
        chapterId,
        topicId,
        message,
        meta ? JSON.stringify(meta) : null,
        nowIso()
      );
    return camel(db.prepare('SELECT * FROM activities WHERE id = ?').get(info.lastInsertRowid));
  },

  listRecent(userId, limit = 8) {
    return camelAll(
      db
        .prepare(
          `SELECT * FROM activities WHERE user_id = ?
            ORDER BY created_at DESC, id DESC LIMIT ?`
        )
        .all(userId, limit)
    );
  },
};
