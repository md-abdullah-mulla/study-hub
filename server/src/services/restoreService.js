import { db } from '../db/connection.js';
import { nowIso } from '../utils/date.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { badRequest } from '../utils/http.js';

/**
 * Restoring a backup (Phase 5).
 *
 * The snapshot is the shape produced by `buildBackup()`: a subject → chapter →
 * topic tree with every progress field, plus notes, generated content, study
 * sessions, quizzes with their questions and results, and exams. Rows carry a
 * `topicPath` / `chapterPath` ("Subject | Chapter | Topic") exactly so that a
 * restore can re-attach them by name — ids are different in a fresh database.
 *
 * Everything runs inside one transaction: either the whole restore succeeds, or
 * the database is left exactly as it was.
 */
const pathKey = (...parts) => parts.map((part) => String(part ?? '').trim().toLowerCase()).join('|');

export function restoreBackup(userId, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.subjects)) throw badRequest('Backup ফাইলটি ঠিক নেই (subjects নেই)');

  const now = nowIso();
  const counts = {
    subjects: 0, chapters: 0, topics: 0, notes: 0, aiContents: 0, sessions: 0,
    quizzes: 0, questions: 0, quizResults: 0, exams: 0,
  };

  db.exec('BEGIN');
  try {
    // 1) clean slate for this student — deleting subjects cascades to chapters,
    //    topics, notes, revisions, quizzes and their questions
    db.prepare('DELETE FROM subjects WHERE user_id = ?').run(userId);

    const topicIds = new Map(); // path → new topic id
    const chapterIds = new Map(); // subject|chapter → new chapter id

    for (const subject of snapshot.subjects) {
      const subjectId = db
        .prepare(
          `INSERT INTO subjects (user_id, name, name_bn, color, icon, order_index, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          userId,
          subject.name,
          subject.nameBn ?? null,
          subject.color ?? null,
          subject.icon ?? null,
          subject.orderIndex ?? 0,
          now,
          now
        ).lastInsertRowid;
      counts.subjects += 1;

      for (const chapter of subject.chapters ?? []) {
        const chapterId = db
          .prepare(
            `INSERT INTO chapters (subject_id, name, name_bn, number, order_index, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            subjectId,
            chapter.name,
            chapter.nameBn ?? null,
            chapter.number ?? 0,
            chapter.orderIndex ?? 0,
            now,
            now
          ).lastInsertRowid;
        chapterIds.set(pathKey(subject.name, chapter.name), chapterId);
        counts.chapters += 1;

        for (const topic of chapter.topics ?? []) {
          const topicId = db
            .prepare(
              `INSERT INTO topics (
                 chapter_id, name, name_bn, description, importance, status, confidence,
                 revision_stage, revision_count, last_revision_at, next_revision_at,
                 started_at, last_studied_at, completed_at, order_index, created_at, updated_at
               ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
            )
            .run(
              chapterId,
              topic.name,
              topic.nameBn ?? null,
              topic.description ?? null,
              topic.importance ?? 'medium',
              topic.status ?? 'not_started',
              topic.confidence ?? null,
              topic.revisionStage ?? 'none',
              topic.revisionCount ?? 0,
              topic.lastRevisionAt ?? null,
              topic.nextRevisionAt ?? null,
              topic.startedAt ?? null,
              topic.lastStudiedAt ?? null,
              topic.completedAt ?? null,
              topic.orderIndex ?? 0,
              now,
              now
            ).lastInsertRowid;
          topicIds.set(pathKey(subject.name, chapter.name, topic.name), topicId);
          counts.topics += 1;
        }
      }
    }

    /** The snapshot stores paths lowercased by the key helper; match the same way. */
    const topicOf = (row) => {
      const path = row?.topicPath ? pathKey(...String(row.topicPath).split('|')) : null;
      return path ? (topicIds.get(path) ?? null) : null;
    };
    const chapterOf = (row) => {
      const path = row?.chapterPath ? pathKey(...String(row.chapterPath).split('|')) : null;
      return path ? (chapterIds.get(path) ?? null) : null;
    };

    // 2) notes (personal and AI notes both come back; standalone notes stay standalone)
    for (const note of snapshot.notes ?? []) {
      if (!note.body) continue;
      const topicId = topicOf(note);
      if (!topicId && (note.source ?? 'personal') !== 'personal') continue;
      db.prepare(
        `INSERT INTO notes (topic_id, user_id, source, title, body, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(topicId, userId, note.source ?? 'personal', note.title ?? null, note.body, note.createdAt ?? now, now);
      counts.notes += 1;
    }

    // 3) generated study content
    for (const content of snapshot.aiContents ?? []) {
      const topicId = topicOf(content);
      if (!topicId || !content.body) continue;
      db.prepare(
        `INSERT INTO ai_contents (topic_id, user_id, kind, language, title, body, model, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        topicId,
        userId,
        content.kind,
        content.language ?? 'bn',
        content.title ?? null,
        content.body,
        content.model ?? 'pattern-library',
        content.createdAt ?? now,
        now
      );
      counts.aiContents += 1;
    }

    // 4) study sessions (study-time analytics depend on these)
    for (const session of snapshot.studySessions ?? []) {
      db.prepare(
        `INSERT INTO study_sessions (
           user_id, subject_id, chapter_id, topic_id, started_at, ended_at, duration_minutes,
           confidence, revision_needed, topics_completed, note, created_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        userId,
        null,
        null,
        topicOf(session),
        session.startedAt ?? now,
        session.endedAt ?? null,
        session.durationMinutes ?? 0,
        session.confidence ?? null,
        session.revisionNeeded ? 1 : 0,
        session.topicsCompleted ? 1 : 0,
        session.note ?? null,
        session.createdAt ?? now
      );
      counts.sessions += 1;
    }

    // 5) quizzes → questions → results → answers
    const quizIdMap = new Map();
    const questionIdMap = new Map();

    for (const quiz of snapshot.quizzes ?? []) {
      const quizId = db
        .prepare('INSERT INTO quizzes (chapter_id, user_id, title, created_by, created_at) VALUES (?, ?, ?, ?, ?)')
        .run(chapterOf(quiz), userId, quiz.title, quiz.createdBy ?? 'user', quiz.createdAt ?? now).lastInsertRowid;
      quizIdMap.set(quiz.id, quizId);
      counts.quizzes += 1;

      for (const question of (snapshot.quizQuestions ?? []).filter((row) => row.quizId === quiz.id)) {
        const questionId = db
          .prepare(
            `INSERT INTO quiz_questions (quiz_id, topic_id, type, question, options_json, correct_answer, explanation, order_index)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
          )
          .run(
            quizId,
            topicOf(question),
            question.type,
            question.question,
            question.optionsJson ?? null,
            question.correctAnswer ?? null,
            question.explanation ?? null,
            question.orderIndex ?? 0
          ).lastInsertRowid;
        questionIdMap.set(question.id, questionId);
        counts.questions += 1;
      }
    }

    for (const result of snapshot.quizResults ?? []) {
      const quizId = quizIdMap.get(result.quizId);
      if (!quizId) continue;
      const resultId = db
        .prepare(
          'INSERT INTO quiz_results (quiz_id, user_id, score, total, accuracy, weak_topics_json, taken_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
        )
        .run(
          quizId,
          userId,
          result.score ?? 0,
          result.total ?? 0,
          result.accuracy ?? 0,
          result.weakTopicsJson ?? null,
          result.takenAt ?? now
        ).lastInsertRowid;
      counts.quizResults += 1;

      for (const answer of (snapshot.quizAnswers ?? []).filter((row) => row.resultId === result.id)) {
        db.prepare(
          `INSERT INTO quiz_answers (result_id, question_id, topic_id, answer, is_correct, awarded, max_points, self_graded)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
          resultId,
          questionIdMap.get(answer.questionId) ?? null,
          topicOf(answer),
          answer.answer ?? null,
          answer.isCorrect ? 1 : 0,
          answer.awarded ?? 0,
          answer.maxPoints ?? 1,
          answer.selfGraded ? 1 : 0
        );
      }
    }

    // 6) exams — graded attempts come back with their score; in-progress ones are skipped
    for (const exam of snapshot.exams ?? []) {
      if (exam.status !== 'submitted') continue;
      db.prepare(
        `INSERT INTO exams (
           user_id, subject_id, chapter_id, topic_id, scope_label, title, question_count, duration_minutes,
           status, questions_json, answers_json, started_at, submitted_at, total, correct, wrong, unanswered,
           score, percentage, time_taken_seconds, created_at, updated_at
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'submitted', '[]', NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(
        userId,
        null,
        null,
        topicOf(exam),
        exam.scopeLabel ?? 'Restored exam',
        exam.title ?? 'Restored exam',
        exam.questionCount ?? exam.total ?? 0,
        exam.durationMinutes ?? 0,
        exam.startedAt ?? now,
        exam.submittedAt ?? now,
        exam.total ?? 0,
        exam.correct ?? 0,
        exam.wrong ?? 0,
        exam.unanswered ?? 0,
        exam.score ?? 0,
        exam.percentage ?? 0,
        exam.timeTakenSeconds ?? null,
        exam.createdAt ?? now,
        now
      );
      counts.exams += 1;
    }

    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  activityRepo.record({
    userId,
    type: 'data_restored',
    message: `Backup থেকে data ফিরল: ${counts.subjects} subject, ${counts.topics} topic, ${counts.sessions} session`,
  });

  return counts;
}
