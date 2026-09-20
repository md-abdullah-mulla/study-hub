import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/** Quizzes belong to a chapter, so a quiz is always "Chapter 3 এর quiz". */
const QUIZ_COLUMNS = `q.*,
  c.name AS chapter_name, c.number AS chapter_number,
  s.id AS subject_id, s.name AS subject_name, s.color AS subject_color,
  (SELECT COUNT(*) FROM quiz_questions qq WHERE qq.quiz_id = q.id) AS question_count,
  (SELECT COUNT(*) FROM quiz_results qr WHERE qr.quiz_id = q.id) AS attempt_count`;

const QUIZ_JOINS = `JOIN chapters c ON c.id = q.chapter_id
                    JOIN subjects s ON s.id = c.subject_id`;

const withParsedCounts = (row) => {
  const quiz = camel(row);
  if (!quiz) return quiz;
  return {
    ...quiz,
    questionCount: quiz.questionCount ?? 0,
    attemptCount: quiz.attemptCount ?? 0,
  };
};

export const quizRepo = {
  listByUser(userId) {
    return camelAll(
      db
        .prepare(
          `SELECT ${QUIZ_COLUMNS} FROM quizzes q ${QUIZ_JOINS}
            WHERE q.user_id = ?
            ORDER BY s.order_index, c.order_index, q.created_at DESC`
        )
        .all(userId)
    ).map((row) => ({ ...row, questionCount: row.questionCount ?? 0, attemptCount: row.attemptCount ?? 0 }));
  },

  listByChapter(chapterId) {
    return camelAll(
      db.prepare(`SELECT ${QUIZ_COLUMNS} FROM quizzes q ${QUIZ_JOINS} WHERE q.chapter_id = ?`).all(chapterId)
    );
  },

  findById(id) {
    return withParsedCounts(db.prepare(`SELECT ${QUIZ_COLUMNS} FROM quizzes q ${QUIZ_JOINS} WHERE q.id = ?`).get(id));
  },

  /** True only when this quiz belongs to the given user. */
  belongsToUser(id, userId) {
    const row = db.prepare('SELECT user_id FROM quizzes WHERE id = ?').get(id);
    return Boolean(row) && row.user_id === userId;
  },

  create(data) {
    const info = db
      .prepare('INSERT INTO quizzes (chapter_id, user_id, title, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(data.chapterId, data.userId, data.title, data.createdBy ?? 'user', nowIso());
    return quizRepo.findById(info.lastInsertRowid);
  },

  update(id, patch) {
    const current = quizRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare('UPDATE quizzes SET title = ?, chapter_id = ? WHERE id = ?').run(
      merged.title,
      merged.chapterId,
      id
    );
    return quizRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM quizzes WHERE id = ?').run(id).changes > 0;
  },
};
