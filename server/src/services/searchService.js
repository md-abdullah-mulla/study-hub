import { db } from '../db/connection.js';
import { camelAll } from '../utils/rows.js';

/**
 * GLOBAL SEARCH (spec §20)
 * Searches subjects, chapters, topics, personal notes and AI content.
 * LIKE with escaped wildcards — good enough for one user's data, and easy to
 * swap for PostgreSQL full-text search later because it lives in one file.
 */
function like(term) {
  return `%${String(term).replace(/[%_]/g, (m) => `\\${m}`)}%`;
}

export function globalSearch(userId, term, limit = 6) {
  const query = (term ?? '').trim();
  if (!query) return { query, total: 0, subjects: [], chapters: [], topics: [], notes: [], aiContents: [] };

  const pattern = like(query);

  const subjects = camelAll(
    db
      .prepare(
        `SELECT * FROM subjects
          WHERE user_id = ? AND is_archived = 0 AND (name LIKE ? ESCAPE '\\' OR name_bn LIKE ? ESCAPE '\\' OR code LIKE ? ESCAPE '\\')
          ORDER BY order_index LIMIT ?`
      )
      .all(userId, pattern, pattern, pattern, limit)
  );

  const chapters = camelAll(
    db
      .prepare(
        `SELECT c.*, s.name AS subject_name, s.color AS subject_color
           FROM chapters c JOIN subjects s ON s.id = c.subject_id
          WHERE s.user_id = ? AND s.is_archived = 0
            AND (c.name LIKE ? ESCAPE '\\' OR c.name_bn LIKE ? ESCAPE '\\')
          ORDER BY s.order_index, c.number LIMIT ?`
      )
      .all(userId, pattern, pattern, limit)
  );

  const topics = camelAll(
    db
      .prepare(
        `SELECT t.*, c.name AS chapter_name, c.number AS chapter_number, s.name AS subject_name, s.color AS subject_color
           FROM topics t
           JOIN chapters c ON c.id = t.chapter_id
           JOIN subjects s ON s.id = c.subject_id
          WHERE s.user_id = ? AND s.is_archived = 0
            AND (t.name LIKE ? ESCAPE '\\' OR t.name_bn LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\')
          ORDER BY s.order_index, c.number, t.order_index LIMIT ?`
      )
      .all(userId, pattern, pattern, pattern, limit)
  );

  const notes = camelAll(
    db
      .prepare(
        `SELECT n.*, t.name AS topic_name, s.name AS subject_name,
                s.id AS subject_id, c.id AS chapter_id
           FROM notes n
           JOIN topics t ON t.id = n.topic_id
           JOIN chapters c ON c.id = t.chapter_id
           JOIN subjects s ON s.id = c.subject_id
          WHERE n.user_id = ? AND (n.title LIKE ? ESCAPE '\\' OR n.body LIKE ? ESCAPE '\\')
          ORDER BY n.updated_at DESC LIMIT ?`
      )
      .all(userId, pattern, pattern, limit)
  );

  const aiContents = camelAll(
    db
      .prepare(
        `SELECT a.id, a.kind, a.title, substr(a.body, 1, 160) AS snippet, a.topic_id,
                t.name AS topic_name, s.name AS subject_name
           FROM ai_contents a
           JOIN topics t ON t.id = a.topic_id
           JOIN chapters c ON c.id = t.chapter_id
           JOIN subjects s ON s.id = c.subject_id
          WHERE a.user_id = ? AND (a.title LIKE ? ESCAPE '\\' OR a.body LIKE ? ESCAPE '\\')
          ORDER BY a.updated_at DESC LIMIT ?`
      )
      .all(userId, pattern, pattern, limit)
  );

  return {
    query,
    total: subjects.length + chapters.length + topics.length + notes.length + aiContents.length,
    subjects,
    chapters,
    topics,
    notes,
    aiContents,
  };
}
