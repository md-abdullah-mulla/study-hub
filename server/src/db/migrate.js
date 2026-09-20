import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from './connection.js';
import { config } from '../config.js';
import { nowIso } from '../utils/date.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const SCHEMA_VERSION = '1';

/** Creates every table if it does not exist yet. Safe to run on every boot. */
export function migrate() {
  const sql = fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
  db.exec(sql);
  db.prepare(
    `INSERT INTO app_meta (key, value) VALUES ('schema_version', ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(SCHEMA_VERSION);
}

/** Phase 1 is single-user; make sure the local user row always exists. */
export function ensureDefaultUser() {
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(config.defaultUser.id);
  if (existing) return existing;
  db.prepare(
    'INSERT INTO users (id, name, email, created_at) VALUES (?, ?, ?, ?)'
  ).run(config.defaultUser.id, config.defaultUser.name, config.defaultUser.email, nowIso());
  return { id: config.defaultUser.id };
}

/** Called once at server start. */
export function bootstrapDatabase() {
  migrate();
  ensureDefaultUser();
  return { schemaVersion: SCHEMA_VERSION, dbFile: config.dbFile };
}
