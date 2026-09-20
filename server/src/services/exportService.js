import { db } from '../db/connection.js';
import { buildProgressTree } from './progressService.js';
import { camel, camelAll } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * BACKUP / EXPORT (spec §31)
 *
 * `buildBackup` returns everything that belongs to the student in one JSON
 * object. It is used by
 *   - Settings → Backup (JSON)          (file download)
 *   - the auto-backup snapshots         (server/src/services/backupService.js)
 *   - the printable PDF report          (client, "Export Report as PDF")
 * so all three always carry the same data.
 */
/**
 * Every row that points at a topic/chapter is also given its path
 * ("Subject | Chapter | Topic"). Ids change when data is restored, names do not,
 * so the path is what lets a restore re-attach notes, sessions, questions and
 * exams to the right topic.
 */
function pathMaps(tree) {
  const topicPath = new Map();
  const chapterPath = new Map();
  for (const subject of tree.subjects) {
    for (const chapter of subject.chapters) {
      chapterPath.set(chapter.id, `${subject.name}|${chapter.name}`);
      for (const topic of chapter.topics) {
        topicPath.set(topic.id, `${subject.name}|${chapter.name}|${topic.name}`);
      }
    }
  }
  return { topicPath, chapterPath };
}

export function buildBackup(userId) {
  const tree = buildProgressTree(userId);
  const paths = pathMaps(tree);
  const withTopicPath = (rows) => rows.map((row) => ({ ...row, topicPath: paths.topicPath.get(row.topicId) ?? null }));
  const back = {
    app: 'Smart Semester Study Manager',
    version: 1,
    exportedAt: nowIso(),
    subjects: tree.subjects,
    semester: tree.semester,
    notes: withTopicPath(notesByUser(userId)),
    studyPlan: planByUser(userId, paths),
    studySessions: withTopicPath(sessionsByUser(userId)),
    quizResults: camelAll(db.prepare('SELECT * FROM quiz_results WHERE user_id = ?').all(userId)),
    aiContents: withTopicPath(aiContentsByUser(userId)),
    generatedImages: withTopicPath(imagesByUser(userId)),
    quizzes: quizzesByUser(userId, paths),
    quizQuestions: withTopicPath(quizQuestionsByUser(userId)),
    quizAnswers: withTopicPath(quizAnswersByUser(userId)),
    exams: withTopicPath(examsByUser(userId)),
    revisionHistory: revisionHistoryByUser(userId),
    activities: camelAll(db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY id').all(userId)),
  };
  if (back) return { ...back };
}

// ---- small query helpers (one line each, so the payload above stays readable)

const notesByUser = (userId) => camelAll(db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId));
const sessionsByUser = (userId) => camelAll(db.prepare('SELECT * FROM study_sessions WHERE user_id = ?').all(userId));
const aiContentsByUser = (userId) => camelAll(db.prepare('SELECT * FROM ai_contents WHERE user_id = ?').all(userId));
const imagesByUser = (userId) => camelAll(db.prepare('SELECT * FROM generated_images WHERE user_id = ?').all(userId));
const examsByUser = (userId) =>
  camelAll(
    db
      .prepare(
        `SELECT id, subject_id, chapter_id, topic_id, scope_label, title, question_count,
                duration_minutes, status, total, correct, wrong, unanswered, score,
                percentage, time_taken_seconds, started_at, submitted_at
           FROM exams WHERE user_id = ? ORDER BY id`
      )
      .all(userId)
  );
const quizzesByUser = (userId, paths) =>
  camelAll(db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY id').all(userId)).map((row) => ({
    ...row,
    chapterPath: paths.chapterPath.get(row.chapterId) ?? null,
  }));
const quizQuestionsByUser = (userId) =>
  camelAll(
    db
      .prepare(
        `SELECT qq.* FROM quiz_questions qq JOIN quizzes q ON q.id = qq.quiz_id
          WHERE q.user_id = ? ORDER BY qq.id`
      )
      .all(userId)
  );
const quizAnswersByUser = (userId) =>
  camelAll(
    db
      .prepare(
        `SELECT qa.* FROM quiz_answers qa JOIN quiz_results qr ON qr.id = qa.result_id
          WHERE qr.user_id = ? ORDER BY qa.id`
      )
      .all(userId)
  );
const revisionHistoryByUser = (userId) =>
  camelAll(
    db
      .prepare(
        `SELECT r.* FROM revisions r
           JOIN topics t ON t.id = r.topic_id
           JOIN chapters c ON c.id = t.chapter_id
           JOIN subjects s ON s.id = c.subject_id
          WHERE s.user_id = ?`
      )
      .all(userId)
  );
/** Plan rows are snake_case in the table; the tree already knows the paths. */
const planByUser = (userId, paths) =>
  db
    .prepare('SELECT * FROM study_plan_items WHERE user_id = ?')
    .all(userId)
    .map((row) => ({ ...camel(row), topicPath: paths.topicPath.get(row.topic_id) ?? null }));

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value).replace(/"/g, '""');
  return /[",\n]/.test(text) ? `"${text}"` : text;
}

export function topicsToCsv(userId) {
  const tree = buildProgressTree(userId);
  const header = [
    'subject',
    'chapter_number',
    'chapter_name',
    'topic',
    'status',
    'confidence',
    'revision_stage',
    'next_revision',
    'last_studied',
    'completed_at',
  ];
  const rows = [];
  for (const subject of tree.subjects) {
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        rows.push([
          subject.name,
          chapter.number,
          chapter.name,
          topic.name,
          topic.status,
          topic.confidence ?? '',
          topic.revisionStage,
          topic.nextRevisionAt ?? '',
          topic.lastStudiedAt ?? '',
          topic.completedAt ?? '',
        ]);
      }
    }
  }
  return [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
}
