import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { config } from '../config.js';

/**
 * Single database connection for the whole server.
 *
 * ARCHITECTURE NOTE
 * Every SQL statement in this project lives inside `src/repositories/*`.
 * To move to PostgreSQL later you only replace this file with a `pg` Pool
 * and adjust the few SQLite-specific bits documented in db/schema.sql.
 */
fs.mkdirSync(path.dirname(config.dbFile), { recursive: true });

export const db = new Database(config.dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runInTransaction(work) {
  return db.transaction(work)();
}
