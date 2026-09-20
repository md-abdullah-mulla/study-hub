import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { DB_FILE } from './paths.js';

/**
 * Single database connection for the whole server (NODE ONLY).
 *
 * ARCHITECTURE NOTE
 * Every SQL statement in this project lives inside `src/repositories/*`, and the
 * services/routes only ever touch `db`. That is what makes the browser build
 * possible: on GitHub Pages this file is replaced (Vite alias — see
 * client/vite.config.js) by client/src/browser-db/connectionShim.js, which
 * exposes the same `db` interface on top of sql.js. No repository or service
 * needed a single change.
 *
 * To move to PostgreSQL later, replace only this file with a `pg` Pool.
 */
export const dbFile = DB_FILE;

fs.mkdirSync(path.dirname(dbFile), { recursive: true });

export const db = new Database(dbFile);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function runInTransaction(work) {
  return db.transaction(work)();
}
