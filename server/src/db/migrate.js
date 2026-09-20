import { db } from './connection.js';
import { config } from '../config.js';
import { nowIso } from '../utils/date.js';

/**
 * Schema bootstrap — PURE module (no Node built-ins), because exactly this code
 * also runs in the browser build: there `connection.js` is aliased to the
 * sql.js adapter, and the schema SQL is passed in as a string.
 *
 * Node entry point: ./nodeBootstrap.js  (reads schema.sql from disk)
 * Browser entry point: client/src/browser-db/localApi.js (imports the .sql with ?raw)
 */
const SCHEMA_VERSION = '1';

/** Creates every table if it does not exist yet. Safe to run on every boot. */
export function applySchema(sql) {
  db.exec(sql);
  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES ('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(SCHEMA_VERSION);
  return SCHEMA_VERSION;
}

/** Phase 1 is single-user; make sure the local user row always exists. */
export function ensureDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(config.defaultUser.id);
  if (existing) return existing;
  db.prepare('INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)').run(
    config.defaultUser.id,
    config.defaultUser.name,
    config.defaultUser.email,
    nowIso()
  );
  return { id: config.defaultUser.id };
}

/** Full bootstrap from an already-loaded schema string. */
export function bootstrapFromSql(sql) {
  const schemaVersion = applySchema(sql);
  ensureDefaultUser();
  return { schemaVersion, database: config.databaseLabel };
}
