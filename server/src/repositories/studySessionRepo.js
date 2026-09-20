import { db } from '../db/connection.js';
import { camelAll, withBooleans, mergeDefined } from '../utils/rows.js';
import { nowIso, todayLocalDate, TZ_OFFSET_MINUTES } from '../utils/date.js';

/**
 * Study time: read + write.
 *
 * The analytics numbers (today / streak / per subject) already existed but were
 * always 0, because nothing ever wrote a session. Phase 2 adds the write side.
 * Local date is derived in SQL with the Dhaka offset so day grouping is correct.
 */
const localDate = (alias = '') => `date(${alias}started_at, '+${TZ_OFFSET_MINUTES} minutes')`;
const LOCAL_DATE = localDate(); // for queries that touch study_sessions only

// study_sessions is joined with chapters/topics, which have a started_at column
// of their own — always qualify it in joined queries (SQLite: ambiguous column).
const SESSION_DAY = localDate('ss.');

const SESSION_COLUMNS = `ss.*, s.name AS subject_name, s.color AS subject_color,
                         c.name AS chapter_name, c.number AS chapter_number, t.name AS topic_name`;

const SESSION_JOINS = `LEFT JOIN subjects s ON s.id = ss.subject_id
                       LEFT JOIN chapters c ON c.id = ss.chapter_id
                       LEFT JOIN topics   t ON t.id = ss.topic_id`;

const asSession = (row) => withBooleans(row, ['revisionNeeded']);
const asSessions = (rows) => rows.map(asSession);

export const studySessionRepo = {
  // ---- write side ---------------------------------------------------------
  create(data) {
    const info = db
      .prepare(
        `INSERT INTO study_sessions
           (user_id, subject_id, chapter_id, topic_id, started_at, ended_at,
            duration_minutes, confidence, revision_needed, topics_completed, note, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        data.userId,
        data.subjectId ?? null,
        data.chapterId ?? null,
        data.topicId ?? null,
        data.startedAt,
        data.endedAt ?? null,
        data.durationMinutes ?? 0,
        data.confidence ?? null,
        data.revisionNeeded ? 1 : 0,
        data.topicsCompleted ?? 0,
        data.note ?? null,
        nowIso()
      );
    return studySessionRepo.findById(info.lastInsertRowid);
  },

  findById(id) {
    return asSession(
      db
        .prepare(
          `SELECT ${SESSION_COLUMNS} FROM study_sessions ss ${SESSION_JOINS} WHERE ss.id = ?`
        )
        .get(id)
    );
  },

  /** Partial update — columns nobody mentioned keep their value (mergeDefined). */
  update(id, patch) {
    const current = studySessionRepo.findById(id);
    if (!current) return null;
    const merged = mergeDefined(current, patch);
    db.prepare(
      `UPDATE study_sessions
          SET ended_at = ?, duration_minutes = ?, confidence = ?,
              revision_needed = ?, topics_completed = ?, note = ?
        WHERE id = ?`
    ).run(
      merged.endedAt ?? null,
      merged.durationMinutes ?? 0,
      merged.confidence ?? null,
      merged.revisionNeeded ? 1 : 0,
      merged.topicsCompleted ?? 0,
      merged.note ?? null,
      id
    );
    return studySessionRepo.findById(id);
  },

  remove(id) {
    return db.prepare('DELETE FROM study_sessions WHERE id = ?').run(id).changes > 0;
  },

  /** Newest first. `from`/`to` are local 'YYYY-MM-DD' days (inclusive). */
  listByUser(userId, { limit = 50, from = null, to = null } = {}) {
    return asSessions(
      db
        .prepare(
          `SELECT ${SESSION_COLUMNS}
             FROM study_sessions ss ${SESSION_JOINS}
            WHERE ss.user_id = ?
              AND (? IS NULL OR ${SESSION_DAY} >= ?)
              AND (? IS NULL OR ${SESSION_DAY} <= ?)
            ORDER BY ss.started_at DESC, ss.id DESC
            LIMIT ?`
        )
        .all(userId, from, from, to, to, limit)
    );
  },

  /** Open sessions = started but never ended (used to resume a timer). */
  findOpen(userId) {
    return asSessions(
      db
        .prepare(
          `SELECT ${SESSION_COLUMNS}
             FROM study_sessions ss ${SESSION_JOINS}
            WHERE ss.user_id = ? AND ss.ended_at IS NULL
            ORDER BY ss.started_at DESC`
        )
        .all(userId)
    );
  },

  minutesOnLocalDate(userId, date = todayLocalDate()) {
    return (
      db
        .prepare(
          `SELECT COALESCE(SUM(duration_minutes), 0) AS minutes, COUNT(*) AS sessions
             FROM study_sessions
            WHERE user_id = ? AND ${LOCAL_DATE} = ?`
        )
        .get(userId, date) ?? { minutes: 0, sessions: 0 }
    );
  },

  // ---- read side (existing analytics) -------------------------------------
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
    return asSessions(
      db
        .prepare(
          `SELECT ${SESSION_COLUMNS}
             FROM study_sessions ss ${SESSION_JOINS}
            WHERE ss.user_id = ?
            ORDER BY ss.started_at DESC LIMIT ?`
        )
        .all(userId, limit)
    );
  },
};
