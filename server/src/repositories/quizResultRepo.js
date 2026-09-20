import { db } from '../db/connection.js';
import { camel, camelAll } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * Quiz attempts. A result row holds the totals; the per-question rows in
 * `quiz_answers` hold the detail, which is what lets the app say *which topic*
 * is weak (and prove it) instead of guessing.
 */
const parseWeakTopics = (row) => {
  const result = camel(row);
  if (!result) return result;
  let weakTopics = [];
  if (result.weakTopicsJson) {
    try {
      const parsed = JSON.parse(result.weakTopicsJson);
      weakTopics = Array.isArray(parsed) ? parsed : [];
    } catch {
      weakTopics = [];
    }
  }
  return { ...result, weakTopics };
};

export const quizResultRepo = {
  create({ quizId, userId, score, total, accuracy, weakTopics = [] }) {
    const info = db
      .prepare(
        `INSERT INTO quiz_results (quiz_id, user_id, score, total, accuracy, weak_topics_json, taken_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(quizId, userId, score, total, accuracy, JSON.stringify(weakTopics), nowIso());
    return quizResultRepo.findById(info.lastInsertRowid);
  },

  /** Replaces the summary numbers of an existing attempt (used after self-marking). */
  updateTotals(id, { score, total, accuracy, weakTopics }) {
    db.prepare(
      'UPDATE quiz_results SET score = ?, total = ?, accuracy = ?, weak_topics_json = ? WHERE id = ?'
    ).run(score, total, accuracy, JSON.stringify(weakTopics ?? []), id);
    return quizResultRepo.findById(id);
  },

  findById(id) {
    return parseWeakTopics(db.prepare('SELECT * FROM quiz_results WHERE id = ?').get(id));
  },

  belongsToUser(id, userId) {
    const row = db.prepare('SELECT user_id FROM quiz_results WHERE id = ?').get(id);
    return Boolean(row) && row.user_id === userId;
  },

  listByQuiz(quizId) {
    return camelAll(
      db.prepare('SELECT * FROM quiz_results WHERE quiz_id = ? ORDER BY taken_at DESC').all(quizId)
    ).map((row) => parseWeakTopics({ ...row, weak_topics_json: row.weakTopicsJson }));
  },

  listByUser(userId, limit = 20) {
    return camelAll(
      db
        .prepare(
          `SELECT r.*, q.title AS quiz_title, c.name AS chapter_name, c.number AS chapter_number,
                  s.name AS subject_name, s.color AS subject_color
             FROM quiz_results r
             JOIN quizzes q  ON q.id = r.quiz_id
             JOIN chapters c ON c.id = q.chapter_id
             JOIN subjects s ON s.id = c.subject_id
            WHERE r.user_id = ?
            ORDER BY r.taken_at DESC, r.id DESC
            LIMIT ?`
        )
        .all(userId, limit)
    ).map((row) => parseWeakTopics({ ...row, weak_topics_json: row.weakTopicsJson }));
  },

  /** Overall quiz numbers — 0 attempts means 0%, never an invented average. */
  summary(userId) {
    const row = db
      .prepare(
        `SELECT COUNT(*) AS attempts,
                COALESCE(SUM(score), 0) AS score,
                COALESCE(SUM(total), 0) AS total,
                COALESCE(MAX(accuracy), 0) AS bestAccuracy
           FROM quiz_results WHERE user_id = ?`
      )
      .get(userId);
    return {
      attempts: row.attempts,
      score: row.score,
      total: row.total,
      bestAccuracy: row.attempts ? Math.round(row.bestAccuracy) : 0,
      averageAccuracy: row.total ? Math.round((row.score / row.total) * 100) : 0,
    };
  },

  // ---- per-question answers -------------------------------------------------
  createAnswers(resultId, answers) {
    const insert = db.prepare(
      `INSERT INTO quiz_answers
         (result_id, question_id, topic_id, answer, is_correct, awarded, max_points, self_graded)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const answer of answers) {
      insert.run(
        resultId,
        answer.questionId ?? null,
        answer.topicId ?? null,
        answer.answer ?? null,
        answer.isCorrect ? 1 : 0,
        answer.awarded ?? 0,
        answer.maxPoints ?? 1,
        answer.selfGraded ? 1 : 0
      );
    }
    return quizResultRepo.listAnswers(resultId);
  },

  listAnswers(resultId) {
    return camelAll(
      db.prepare('SELECT * FROM quiz_answers WHERE result_id = ? ORDER BY id').all(resultId)
    ).map((row) => ({ ...row, isCorrect: Boolean(row.isCorrect), selfGraded: Boolean(row.selfGraded) }));
  },

  findAnswer(resultId, questionId) {
    const row = db
      .prepare('SELECT * FROM quiz_answers WHERE result_id = ? AND question_id = ?')
      .get(resultId, questionId);
    if (!row) return null;
    const answer = camel(row);
    return { ...answer, isCorrect: Boolean(answer.isCorrect), selfGraded: Boolean(answer.selfGraded) };
  },

  /** Used when the student marks a written answer after the attempt. */
  updateAnswerSelfScore(resultId, questionId, { awarded, isCorrect, selfGraded = true }) {
    db.prepare(
      'UPDATE quiz_answers SET awarded = ?, is_correct = ?, self_graded = ? WHERE result_id = ? AND question_id = ?'
    ).run(awarded, isCorrect ? 1 : 0, selfGraded ? 1 : 0, resultId, questionId);
    return quizResultRepo.findAnswer(resultId, questionId);
  },

  /**
   * Per-topic accuracy across every attempt. Only answered questions count, so
   * a topic the student never faced cannot be labelled "weak".
   */
  topicAccuracy(userId) {
    return camelAll(
      db
        .prepare(
          `SELECT a.topic_id,
                  COALESCE(SUM(a.awarded), 0)    AS awarded,
                  COALESCE(SUM(a.max_points), 0) AS max_points,
                  COUNT(*)                       AS answered,
                  t.name AS topic_name, t.status AS topic_status,
                  c.id AS chapter_id, c.name AS chapter_name, c.number AS chapter_number,
                  s.id AS subject_id, s.name AS subject_name, s.color AS subject_color
             FROM quiz_answers a
             JOIN quiz_results r ON r.id = a.result_id
             JOIN topics   t ON t.id = a.topic_id
             JOIN chapters c ON c.id = t.chapter_id
             JOIN subjects s ON s.id = c.subject_id
            WHERE r.user_id = ? AND a.topic_id IS NOT NULL
            GROUP BY a.topic_id
            HAVING SUM(a.max_points) > 0
            ORDER BY (SUM(a.awarded) * 1.0 / SUM(a.max_points)) ASC, a.topic_id`
        )
        .all(userId)
    ).map((row) => ({ ...row, accuracy: Math.round((row.awarded / row.maxPoints) * 100) }));
  },
};
