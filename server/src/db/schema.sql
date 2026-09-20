-- =====================================================================
-- Smart Semester Study Management System — database schema
-- =====================================================================
-- Written in plain SQL that is 95% PostgreSQL compatible.
-- When moving to PostgreSQL, change only:
--   INTEGER PRIMARY KEY AUTOINCREMENT  ->  SERIAL PRIMARY KEY
--   TEXT (timestamps)                  ->  TIMESTAMPTZ
--   INTEGER 0/1 (boolean)              ->  BOOLEAN
-- =====================================================================

-- ---------------------------------------------------------------------
-- User
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  email         TEXT    NOT NULL UNIQUE,
  password_hash TEXT,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ---------------------------------------------------------------------
-- Subject -> Chapter -> Topic  (the study hierarchy)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS subjects (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name       TEXT    NOT NULL,              -- English / book name
  name_bn    TEXT,                          -- Bangla name (optional)
  code       TEXT,                          -- e.g. 28561
  color      TEXT    NOT NULL DEFAULT '#2563eb',
  icon       TEXT    NOT NULL DEFAULT 'book',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_archived INTEGER NOT NULL DEFAULT 0,   -- soft delete
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_subjects_user ON subjects(user_id, order_index);

CREATE TABLE IF NOT EXISTS chapters (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  subject_id INTEGER NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  number     INTEGER NOT NULL DEFAULT 1,
  name       TEXT    NOT NULL,
  name_bn    TEXT,
  notes      TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_chapters_subject ON chapters(subject_id, order_index);

CREATE TABLE IF NOT EXISTS topics (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id    INTEGER NOT NULL REFERENCES chapters(id) ON DELETE CASCADE,
  name          TEXT    NOT NULL,
  name_bn       TEXT,
  description   TEXT,
  importance    TEXT    NOT NULL DEFAULT 'medium'   -- low | medium | high
                CHECK (importance IN ('low','medium','high')),
  -- progress -----------------------------------------------------------
  status        TEXT    NOT NULL DEFAULT 'not_started'
                CHECK (status IN ('not_started','studying','completed','needs_revision')),
  confidence    INTEGER CHECK (confidence IS NULL OR (confidence BETWEEN 1 AND 5)),
  -- revision -----------------------------------------------------------
  revision_stage     TEXT NOT NULL DEFAULT 'none'
                     CHECK (revision_stage IN ('none','learned','revision_1','revision_2','final')),
  revision_count     INTEGER NOT NULL DEFAULT 0,
  last_revision_at   TEXT,
  next_revision_at   TEXT,
  -- dates --------------------------------------------------------------
  started_at     TEXT,
  completed_at   TEXT,
  last_studied_at TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0,
  created_at     TEXT    NOT NULL,
  updated_at     TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_topics_chapter ON topics(chapter_id, order_index);
CREATE INDEX IF NOT EXISTS idx_topics_status ON topics(status);

-- Study material attached to a topic (link, PDF path, pasted text...)
CREATE TABLE IF NOT EXISTS study_materials (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  kind       TEXT    NOT NULL DEFAULT 'link',  -- link | file | text
  url_or_path TEXT,
  content    TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_materials_topic ON study_materials(topic_id);

-- ---------------------------------------------------------------------
-- Notes  (personal note and AI note are kept separate via `source`)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source     TEXT    NOT NULL DEFAULT 'personal' CHECK (source IN ('personal','ai')),
  title      TEXT,
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_notes_topic ON notes(topic_id);

-- ---------------------------------------------------------------------
-- AI generated content (Phase 4) + illustrations (Phase 5)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ai_contents (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL,   -- easy_explain | detail | short_note | exam_note | mcq | summary ...
  language   TEXT    NOT NULL DEFAULT 'bn',
  title      TEXT,
  body       TEXT    NOT NULL,
  model      TEXT,
  created_at TEXT    NOT NULL,
  updated_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_ai_contents_topic ON ai_contents(topic_id, kind);

CREATE TABLE IF NOT EXISTS generated_images (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id   INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  prompt     TEXT    NOT NULL,
  caption    TEXT,
  file_path  TEXT    NOT NULL,
  model      TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_topic ON generated_images(topic_id);

-- ---------------------------------------------------------------------
-- Study sessions (Phase 2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS study_sessions (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id       INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id       INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id         INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  started_at       TEXT    NOT NULL,
  ended_at         TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  confidence       INTEGER CHECK (confidence IS NULL OR (confidence BETWEEN 1 AND 5)),
  revision_needed  INTEGER NOT NULL DEFAULT 0,
  topics_completed INTEGER NOT NULL DEFAULT 0,
  note             TEXT,
  created_at       TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, started_at);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);

-- ---------------------------------------------------------------------
-- Revision log (Phase 2)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS revisions (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id     INTEGER NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
  user_id      INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage        TEXT    NOT NULL CHECK (stage IN ('learned','revision_1','revision_2','final')),
  due_at       TEXT,
  completed_at TEXT,
  note         TEXT,
  created_at   TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revisions_topic ON revisions(topic_id);
CREATE INDEX IF NOT EXISTS idx_revisions_due ON revisions(completed_at, due_at);

-- ---------------------------------------------------------------------
-- Quiz (Phase 3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quizzes (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title      TEXT    NOT NULL,
  created_by TEXT    NOT NULL DEFAULT 'user',   -- user | ai
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_quizzes_chapter ON quizzes(chapter_id);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id        INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  topic_id       INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  type           TEXT    NOT NULL CHECK (type IN ('mcq','true_false','short','viva')),
  question       TEXT    NOT NULL,
  options_json   TEXT,
  correct_answer TEXT,
  explanation    TEXT,
  order_index    INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON quiz_questions(quiz_id, order_index);

CREATE TABLE IF NOT EXISTS quiz_results (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id          INTEGER NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  score            REAL    NOT NULL DEFAULT 0,
  total            REAL    NOT NULL DEFAULT 0,
  accuracy         REAL    NOT NULL DEFAULT 0,
  weak_topics_json TEXT,
  taken_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_results_quiz ON quiz_results(quiz_id, taken_at);

-- ---------------------------------------------------------------------
-- Today's study plan (Dashboard) — auto generated, user editable
-- ---------------------------------------------------------------------
-- One row per answered question. Storing the answers (not just the total score)
-- is what makes "weak topic" a measured fact instead of a guess.
CREATE TABLE IF NOT EXISTS quiz_answers (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  result_id   INTEGER NOT NULL REFERENCES quiz_results(id) ON DELETE CASCADE,
  question_id INTEGER REFERENCES quiz_questions(id) ON DELETE SET NULL,
  topic_id    INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  answer      TEXT,
  is_correct  INTEGER NOT NULL DEFAULT 0,
  awarded     REAL    NOT NULL DEFAULT 0,
  max_points  REAL    NOT NULL DEFAULT 1,
  self_graded INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quiz_answers_result ON quiz_answers(result_id);
CREATE INDEX IF NOT EXISTS idx_quiz_answers_topic  ON quiz_answers(topic_id);

CREATE TABLE IF NOT EXISTS study_plan_items (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_date  TEXT    NOT NULL,                    -- YYYY-MM-DD (local, Asia/Dhaka)
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  chapter_id INTEGER REFERENCES chapters(id) ON DELETE CASCADE,
  topic_id   INTEGER REFERENCES topics(id) ON DELETE CASCADE,
  kind       TEXT    NOT NULL DEFAULT 'study' CHECK (kind IN ('study','revision')),
  title      TEXT    NOT NULL,
  is_done    INTEGER NOT NULL DEFAULT 0,
  source     TEXT    NOT NULL DEFAULT 'auto' CHECK (source IN ('auto','user')),
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_user_date ON study_plan_items(user_id, plan_date);

-- ---------------------------------------------------------------------
-- Activity log (feeds "Recent Activity" on the dashboard)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT    NOT NULL,   -- subject_created | topic_status_changed | note_added | ...
  subject_id INTEGER,
  chapter_id INTEGER,
  topic_id   INTEGER,
  message    TEXT    NOT NULL,
  meta_json  TEXT,
  created_at TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id, created_at);

-- ---------------------------------------------------------------------
-- App metadata (schema version for future migrations)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_meta (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- ---------------------------------------------------------------------
-- Exam Mode (Phase 5): a timed exam built only from the chosen
-- subject → chapter → topic, graded automatically
-- ---------------------------------------------------------------------
-- questions_json holds a snapshot of the questions *with* their correct
-- answers, so the exam keeps working (and stays gradable) even if the quiz
-- bank is edited or deleted later. The snapshot is never sent to the client
-- before the exam is submitted.
CREATE TABLE IF NOT EXISTS exams (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subject_id         INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  chapter_id         INTEGER REFERENCES chapters(id) ON DELETE SET NULL,
  topic_id           INTEGER REFERENCES topics(id) ON DELETE SET NULL,
  scope_label        TEXT    NOT NULL,          -- "Subject → Chapter → Topic" as shown in the UI
  title              TEXT    NOT NULL,
  question_count     INTEGER NOT NULL,
  duration_minutes   INTEGER NOT NULL,
  status             TEXT    NOT NULL DEFAULT 'in_progress'
                     CHECK (status IN ('in_progress','submitted')),
  questions_json     TEXT    NOT NULL,
  answers_json       TEXT,
  started_at         TEXT    NOT NULL,
  submitted_at       TEXT,
  total              INTEGER NOT NULL DEFAULT 0,
  correct            INTEGER NOT NULL DEFAULT 0,
  wrong              INTEGER NOT NULL DEFAULT 0,
  unanswered         INTEGER NOT NULL DEFAULT 0,
  score              REAL    NOT NULL DEFAULT 0,
  percentage         REAL    NOT NULL DEFAULT 0,
  time_taken_seconds INTEGER,
  weak_topic_ids_json TEXT,
  created_at         TEXT    NOT NULL,
  updated_at         TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_exams_user ON exams(user_id, started_at);

-- ---------------------------------------------------------------------
-- Auto backup (Phase 5): rolling snapshots of everything the student owns
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS backups (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  kind        TEXT    NOT NULL DEFAULT 'auto' CHECK (kind IN ('auto','manual')),
  label       TEXT    NOT NULL,
  size_bytes  INTEGER NOT NULL DEFAULT 0,
  payload     TEXT    NOT NULL,          -- the same JSON the Settings download produces
  created_at  TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_backups_user ON backups(user_id, created_at);
