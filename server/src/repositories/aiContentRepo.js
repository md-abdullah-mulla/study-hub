import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * Generated study content (Phase 4).
 *
 * `model` records who wrote the text: here it is always the pattern-based
 * generator ('pattern-library' or 'pattern-draft') — never an AI model, because
 * this build calls no AI API. The column keeps that fact next to the text so the
 * UI can say honestly where the content came from.
 */
export const aiContentRepo = {
  listByTopic(topicId) {
    return camelAll(
      db.prepare('SELECT * FROM ai_contents WHERE topic_id = ? ORDER BY kind, id').all(topicId)
    );
  },

  listByUser(userId, limit = 50) {
    return camelAll(
      db
        .prepare(
          `SELECT ac.*, t.name AS topic_name, c.name AS chapter_name, c.number AS chapter_number,
                  s.name AS subject_name, s.color AS subject_color
             FROM ai_contents ac
             JOIN topics   t ON t.id = ac.topic_id
             JOIN chapters c ON c.id = t.chapter_id
             JOIN subjects s ON s.id = c.subject_id
            WHERE ac.user_id = ?
            ORDER BY ac.updated_at DESC, ac.id DESC
            LIMIT ?`
        )
        .all(userId, limit)
    );
  },

  findById(id) {
    return camel(db.prepare('SELECT * FROM ai_contents WHERE id = ?').get(id));
  },

  find(topicId, kind) {
    return camel(
      db.prepare('SELECT * FROM ai_contents WHERE topic_id = ? AND kind = ?').get(topicId, kind)
    );
  },

  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO ai_contents (topic_id, user_id, kind, language, title, body, model, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.topicId,
        data.userId,
        data.kind,
        data.language ?? 'bn',
        data.title ?? null,
        data.body,
        data.model ?? 'pattern-library',
        now,
        now
      );
    return aiContentRepo.findById(info.lastInsertRowid);
  },

  /** Saving the same kind twice replaces the text instead of piling up copies. */
  upsert(data) {
    const existing = aiContentRepo.find(data.topicId, data.kind);
    if (!existing) return aiContentRepo.create(data);
    return aiContentRepo.update(existing.id, {
      title: data.title ?? existing.title,
      body: data.body,
      model: data.model ?? existing.model,
    });
  },

  update(id, patch) {
    const current = aiContentRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare('UPDATE ai_contents SET title = ?, body = ?, model = ?, updated_at = ? WHERE id = ?').run(
      merged.title ?? null,
      merged.body,
      merged.model ?? current.model,
      nowIso(),
      id
    );
    return aiContentRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM ai_contents WHERE id = ?').run(id).changes > 0;
  },
};
