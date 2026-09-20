import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

export const topicRepo = {
  listByChapter(chapterId) {
    return camelAll(
      db
        .prepare('SELECT * FROM topics WHERE chapter_id = ? ORDER BY order_index, id')
        .all(chapterId)
    );
  },

  findById(id) {
    return camel(db.prepare('SELECT * FROM topics WHERE id = ?').get(id));
  },

  /**
   * Every topic joined with its chapter + subject.
   * The progress engine works from this single query so all percentages
   * (topic -> chapter -> subject -> semester) use identical logic.
   */
  listTree(userId) {
    return camelAll(
      db
        .prepare(
          `SELECT t.*,
                  c.name  AS chapter_name, c.number AS chapter_number, c.subject_id AS subject_id,
                  s.name  AS subject_name, s.color AS subject_color
             FROM topics t
             JOIN chapters c ON c.id = t.chapter_id
             JOIN subjects s ON s.id = c.subject_id
            WHERE s.user_id = ? AND s.is_archived = 0
            ORDER BY s.order_index, s.id, c.order_index, c.number, t.order_index, t.id`
        )
        .all(userId)
    );
  },

  countByChapter(chapterId) {
    return db
      .prepare('SELECT COUNT(*) AS count FROM topics WHERE chapter_id = ?')
      .get(chapterId).count;
  },

  nextOrderIndex(chapterId) {
    const row = db
      .prepare(
        'SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM topics WHERE chapter_id = ?'
      )
      .get(chapterId);
    return row.next;
  },

  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO topics
           (chapter_id, name, name_bn, description, importance, status, order_index, created_at, updated_at)
         VALUES (@chapterId, @name, @nameBn, @description, @importance, @status, @orderIndex, @now, @now)`
      )
      .run({
        chapterId: data.chapterId,
        name: data.name,
        nameBn: data.nameBn ?? null,
        description: data.description ?? null,
        importance: data.importance ?? 'medium',
        status: data.status ?? 'not_started',
        orderIndex: data.orderIndex ?? topicRepo.nextOrderIndex(data.chapterId),
        now,
      });
    return topicRepo.findById(info.lastInsertRowid);
  },

  update(id, data) {
    const current = topicRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, data);
    db.prepare(
      `UPDATE topics SET
         name = @name, name_bn = @nameBn, description = @description, importance = @importance,
         status = @status, confidence = @confidence,
         revision_stage = @revisionStage, revision_count = @revisionCount,
         last_revision_at = @lastRevisionAt, next_revision_at = @nextRevisionAt,
         started_at = @startedAt, completed_at = @completedAt, last_studied_at = @lastStudiedAt,
         order_index = @orderIndex, updated_at = @updatedAt
       WHERE id = @id`
    ).run({
      id,
      name: merged.name,
      nameBn: merged.nameBn ?? null,
      description: merged.description ?? null,
      importance: merged.importance,
      status: merged.status,
      confidence: merged.confidence ?? null,
      revisionStage: merged.revisionStage ?? 'none',
      revisionCount: merged.revisionCount ?? 0,
      lastRevisionAt: merged.lastRevisionAt ?? null,
      nextRevisionAt: merged.nextRevisionAt ?? null,
      startedAt: merged.startedAt ?? null,
      completedAt: merged.completedAt ?? null,
      lastStudiedAt: merged.lastStudiedAt ?? null,
      orderIndex: merged.orderIndex,
      updatedAt: nowIso(),
    });
    return topicRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM topics WHERE id = ?').run(id).changes > 0;
  },

  /** move all topics of one chapter to the same status (bulk action) */
  bulkStatus(chapterId, status, now) {
    return db
      .prepare('UPDATE topics SET status = ?, updated_at = ? WHERE chapter_id = ?')
      .run(status, now, chapterId).changes;
  },
};
