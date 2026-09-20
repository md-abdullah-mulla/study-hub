import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Database file path WITHOUT opening a connection.
 *
 * Kept separate on purpose: scripts such as db/reset.js must be able to delete
 * the file before anything opens it. Importing connection.js would create the
 * database immediately (and writes would then go to the deleted file).
 */
const here = path.dirname(fileURLToPath(import.meta.url));
export const SERVER_DIR = path.resolve(here, '..', '..');

export const DB_FILE = process.env.DB_FILE ?? path.join(SERVER_DIR, '..', 'data', 'study.db');
