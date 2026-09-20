import { db } from '../db/connection.js';
import { camel, camelAll, mergeDefined } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * Exam Mode storage.
 *
 * One row is one exam attempt. The questions are stored as a snapshot
 * (`questions_json`, answers included) so a finished exam can always be
 * reviewed later, even when the quiz bank changes. The service is responsible
 * for stripping the answers before anything is sent to the browser.
 */
export const examRepo = {
  create(data) {
    const now = nowIso();
    const info = db
      .prepare(
        `INSERT INTO exams (
           user_id, subject_id, chapter_id, topic_id, scope_label, title,
           question_count, duration_minutes, status, questions_json,
           started_at, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'in_progress', ?, ?, ?, ?)`
      )
      .run(
        data.userId,
        data.subjectId ?? null,
        data.chapterId ?? null,
        data.topicId ?? null,
        data.scopeLabel,
        data.title,
        data.questionCount,
        data.durationMinutes,
        JSON.stringify(data.questions),
        data.startedAt,
        now,
        now
      );
    return examRepo.findById(info.lastInsertRowid);
  },

  findById(id) {
    return camel(db.prepare('SELECT * FROM exams WHERE id = ?').get(id));
  },

  listByUser(userId, limit = 25) {
    return camelAll(
      db
        .prepare(
          `SELECT e.*, s.name AS subject_name, c.name AS chapter_name, t.name AS topic_name
             FROM exams e
             LEFT JOIN subjects s ON s.id = e.subject_id
             LEFT JOIN chapters c ON c.id = e.chapter_id
             LEFT JOIN topics   t ON t.id = e.topic_id
            WHERE e.user_id = ?
            ORDER BY e.started_at DESC, e.id DESC
            LIMIT ?`
        )
        .all(userId, limit)
    );
  },

  listSubmitted(userId) {
    return camelAll(
      db
        .prepare("SELECT * FROM exams WHERE user_id = ? AND status = 'submitted' ORDER BY started_at DESC")
        .all(userId)
    );
  },

  update(id, patch) {
    const current = examRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare(
      `UPDATE exams
          SET status = ?, answers_json = ?, submitted_at = ?, total = ?, correct = ?, wrong = ?,
              unanswered = ?, score = ?, percentage = ?, time_taken_seconds = ?,
              weak_topic_ids_json = ?, updated_at = ?
        WHERE id = ?`
    ).run(
      merged.status,
      merged.answersJson ?? null,
      merged.submittedAt ?? null,
      merged.total ?? 0,
      merged.correct ?? 0,
      merged.wrong ?? 0,
      merged.unanswered ?? 0,
      merged.score ?? 0,
      merged.percentage ?? 0,
      merged.timeTakenSeconds ?? null,
      merged.weakTopicIdsJson ?? null,
      nowIso(),
      id
    );
    return examRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM exams WHERE id = ?').run(id).changes > 0;
  },

  /** Auto-gradable questions of the student's own quiz bank, filtered by scope. */
  bankQuestions(userId, { subjectId, chapterId, topicId } = {}) {
    const where = ["q.user_id = ?", "qq.type IN ('mcq','true_false')", 'qq.correct_answer IS NOT NULL'];
    const params = [userId];
    if (topicId) {
      where.push('qq.topic_id = ?');
      params.push(topicId);
    } else if (chapterId) {
      where.push('t.chapter_id = ?');
      params.push(chapterId);
    } else if (subjectId) {
      where.push('c.subject_id = ?');
      params.push(subjectId);
    }
    return camelAll(
      db
        .prepare(
          `SELECT qq.id, qq.question, qq.options_json, qq.correct_answer, qq.topic_id, qq.type,
                  t.name AS topic_name, c.name AS chapter_name
             FROM quiz_questions qq
             JOIN quizzes  q ON q.id = qq.quiz_id
             LEFT JOIN topics   t ON t.id = qq.topic_id
             LEFT JOIN chapters c ON c.id = t.chapter_id
            WHERE ${where.join(' AND ')}`
        )
        .all(...params)
    );
  },
};
