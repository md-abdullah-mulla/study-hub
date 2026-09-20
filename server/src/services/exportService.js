import { db } from '../db/connection.js';
import { buildProgressTree } from './progressService.js';
import { camelAll } from '../utils/rows.js';
import { nowIso } from '../utils/date.js';

/**
 * BACKUP / EXPORT (spec §31)
 * Phase 1 ships a complete JSON backup (works today) and a flat CSV of all
 * topics (opens in Excel). PDF export is a later-phase addition.
 */
export function buildBackup(userId) {
  const tree = buildProgressTree(userId);
  return {
    app: 'Smart Semester Study Manager',
    version: 1,
    exportedAt: nowIso(),
    subjects: tree.subjects,
    semester: tree.semester,
    notes: camelAll(db.prepare('SELECT * FROM notes WHERE user_id = ?').all(userId)),
    studyPlan: camelAll(db.prepare('SELECT * FROM study_plan_items WHERE user_id = ?').all(userId)),
    studySessions: camelAll(db.prepare('SELECT * FROM study_sessions WHERE user_id = ?').all(userId)),
    quizResults: camelAll(db.prepare('SELECT * FROM quiz_results WHERE user_id = ?').all(userId)),
    aiContents: camelAll(db.prepare('SELECT * FROM ai_contents WHERE user_id = ?').all(userId)),
    generatedImages: camelAll(db.prepare('SELECT * FROM generated_images WHERE user_id = ?').all(userId)),
  };
}

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
