import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { bootstrapFromSql } from './migrate.js';
import { dbFile } from './connection.js';

/**
 * NODE-ONLY database bootstrap: reads schema.sql from disk and hands the SQL to
 * the pure bootstrap in migrate.js. The browser build never imports this file —
 * there the same `bootstrapFromSql()` receives the schema SQL as a string.
 */
const here = path.dirname(fileURLToPath(import.meta.url));

export function loadSchemaSql() {
  return fs.readFileSync(path.join(here, 'schema.sql'), 'utf8');
}

/** Called once at server start. */
export function bootstrapDatabase() {
  const info = bootstrapFromSql(loadSchemaSql());
  return { ...info, dbFile };
}

export { ensureDefaultUser } from './migrate.js';
