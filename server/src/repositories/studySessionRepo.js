import { db } from '../db/connection.js';
import { camelAll } from '../utils/rows.js';
import { TZ_OFFSET_MINUTES } from '../utils/date.js';

/**
 * Read queries for study time. Writing sessions arrives in Phase 2,
 * but the analytics numbers are already real (empty DB -> 0 minutes).
 * Local date is derived in SQL with the Dhaka offset so day grouping is correct.
 */
const LOCAL_DATE = `date(started_at, '+${TZ_OFFSET_MINUTES} minutes')`;

export const studySessionRepo = {
  totalMinutes(userId) {
    return (
      db
        .prepare('SELECT COALESCE(SUM(duration_minutes), 0) AS minutes FROM study_sessions WHERE user_id = ?')
        .get(userId).minutes ?? 0
    );
  },

  minutesByLocalDate(userId) {
    return camelAll(
      db
        .prepare(
          `SELECT ${LOCAL_DATE} AS day, COALESCE(SUM(duration_minutes), 0) AS minutes,
                  COUNT(*) AS sessions
             FROM study_sessions WHERE user_id = ?
            GROUP BY day ORDER BY day`
        )
        .all(userId)
    );
  },

  minutesBySubject(userId) {
    return camelAll(
      db
        .prepare(
          `SELECT s.id AS subject_id, s.name AS subject_name, s.color AS subject_color,
                  COALESCE(SUM(ss.duration_minutes), 0) AS minutes
             FROM subjects s
             LEFT JOIN study_sessions ss ON ss.subject_id = s.id AND ss.user_id = s.user_id
            WHERE s.user_id = ? AND s.is_archived = 0
            GROUP BY s.id ORDER BY minutes DESC, s.order_index`
        )
        .all(userId)
    );
  },

  listRecent(userId, limit = 20) {
    return camelAll(
      db
        .prepare(
          `SELECT ss.*, s.name AS subject_name, s.color AS subject_color,
                  c.name AS chapter_name, t.name AS topic_name
             FROM study_sessions ss
             LEFT JOIN subjects s ON s.id = ss.subject_id
             LEFT JOIN chapters c ON c.id = ss.chapter_id
             LEFT JOIN topics   t ON t.id = ss.topic_id
            WHERE ss.user_id = ?
            ORDER BY ss.started_at DESC LIMIT ?`
        )
        .all(userId, limit)
    );
  },
};
