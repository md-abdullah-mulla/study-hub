import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';

/**
 * Questions of a quiz. Options live as a JSON array in `options_json`, which
 * keeps the schema simple for all four question types (short/viva have none).
 *
 * `forAttempt` hides the answer + explanation: the browser must never receive
 * the correct answer before the student has submitted, otherwise the score
 * would mean nothing.
 */
const parseOptions = (row) => {
  const question = camel(row);
  if (!question) return question;
  let options = [];
  if (question.optionsJson) {
    try {
      const parsed = JSON.parse(question.optionsJson);
      options = Array.isArray(parsed) ? parsed : [];
    } catch {
      options = [];
    }
  }
  return { ...question, options };
};

export const quizQuestionRepo = {
  listByQuiz(quizId, { includeAnswers = true } = {}) {
    const rows = camelAll(
      db
        .prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY order_index, id')
        .all(quizId)
    );
    return rows.map((row) => {
      const parsed = parseOptions({ ...camel(row), options_json: row.optionsJson });
      if (includeAnswers) return parsed;
      const { correctAnswer, explanation, ...safe } = parsed;
      return { ...safe, hasAnswer: Boolean(correctAnswer), hasExplanation: Boolean(explanation) };
    });
  },

  findById(id) {
    return parseOptions(db.prepare('SELECT * FROM quiz_questions WHERE id = ?').get(id));
  },

  countByQuiz(quizId) {
    return db.prepare('SELECT COUNT(*) AS count FROM quiz_questions WHERE quiz_id = ?').get(quizId).count;
  },

  nextOrderIndex(quizId) {
    return db
      .prepare('SELECT COALESCE(MAX(order_index), -1) + 1 AS next FROM quiz_questions WHERE quiz_id = ?')
      .get(quizId).next;
  },

  create(data) {
    const info = db
      .prepare(
        `INSERT INTO quiz_questions
           (quiz_id, topic_id, type, question, options_json, correct_answer, explanation, order_index)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.quizId,
        data.topicId ?? null,
        data.type,
        data.question,
        data.options?.length ? JSON.stringify(data.options) : null,
        data.correctAnswer ?? null,
        data.explanation ?? null,
        data.orderIndex ?? quizQuestionRepo.nextOrderIndex(data.quizId)
      );
    return quizQuestionRepo.findById(info.lastInsertRowid);
  },

  update(id, patch) {
    const current = quizQuestionRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare(
      `UPDATE quiz_questions
          SET topic_id = ?, type = ?, question = ?, options_json = ?, correct_answer = ?, explanation = ?, order_index = ?
        WHERE id = ?`
    ).run(
      merged.topicId ?? null,
      merged.type,
      merged.question,
      merged.options?.length ? JSON.stringify(merged.options) : null,
      merged.correctAnswer ?? null,
      merged.explanation ?? null,
      merged.orderIndex ?? current.orderIndex,
      id
    );
    return quizQuestionRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM quiz_questions WHERE id = ?').run(id).changes > 0;
  },
};
