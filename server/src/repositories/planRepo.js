import { db } from '../db/connection.js';
import { camelAll, withBooleans } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

const BOOLS = ['isDone'];

export const planRepo = {
  listByDate(userId, planDate) {
    return db
      .prepare(
        `SELECT p.*, s.name AS subject_name, s.color AS subject_color,
                c.name AS chapter_name, c.number AS chapter_number
           FROM study_plan_items p
           LEFT JOIN subjects s ON s.id = p.subject_id
           LEFT JOIN chapters c ON c.id = p.chapter_id
          WHERE p.user_id = ? AND p.plan_date = ?
          ORDER BY p.id`
      )
      .all(userId, planDate)
      .map((r) => withBooleans(r, BOOLS));
  },

  findById(id) {
    return withBooleans(
      db.prepare('SELECT * FROM study_plan_items WHERE id = ?').get(id),
      BOOLS
    );
  },

  /** Has today's plan already been generated? (so we never fight the user) */
  countAuto(userId, planDate) {
    return db
      .prepare(
        `SELECT COUNT(*) AS count FROM study_plan_items
          WHERE user_id = ? AND plan_date = ? AND source = 'auto'`
      )
      .get(userId, planDate).count;
  },

  existsAutoItem(userId, planDate, chapterId, kind) {
    return Boolean(
      db
        .prepare(
          `SELECT 1 FROM study_plan_items
            WHERE user_id = ? AND plan_date = ? AND kind = ?
              AND ((chapter_id IS NULL AND ? IS NULL) OR chapter_id = ?)`
        )
        .get(userId, planDate, kind, chapterId, chapterId)
    );
  },

  create(data) {
    const info = db
      .prepare(
        `INSERT INTO study_plan_items
           (user_id, plan_date, subject_id, chapter_id, topic_id, kind, title, is_done, source, created_at)
         VALUES (@userId, @planDate, @subjectId, @chapterId, @topicId, @kind, @title, @isDone, @source, @createdAt)`
      )
      .run({
        userId: data.userId,
        planDate: data.planDate,
        subjectId: data.subjectId ?? null,
        chapterId: data.chapterId ?? null,
        topicId: data.topicId ?? null,
        kind: data.kind ?? 'study',
        title: data.title,
        isDone: data.isDone ? 1 : 0,
        source: data.source ?? 'auto',
        createdAt: nowIso(),
      });
    return planRepo.findById(info.lastInsertRowid);
  },

  /** Update the tick and/or the title of one plan item (both optional). */
  update(id, { isDone, title } = {}) {
    const current = planRepo.findById(id);
    if (!current) return null;
    db.prepare('UPDATE study_plan_items SET is_done = ?, title = ? WHERE id = ?').run(
      (isDone ?? current.isDone) ? 1 : 0,
      title ?? current.title,
      id
    );
    return planRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM study_plan_items WHERE id = ?').run(id).changes > 0;
  },

  clearAuto(userId, planDate) {
    return db
      .prepare(
        `DELETE FROM study_plan_items
          WHERE user_id = ? AND plan_date = ? AND source = 'auto' AND is_done = 0`
      )
      .run(userId, planDate).changes;
  },
};
