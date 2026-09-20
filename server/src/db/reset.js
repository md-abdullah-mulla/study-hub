import fs from 'node:fs';
import { DB_FILE } from './paths.js';

/**
 * Deletes the local database file and re-seeds the Semester 6 structure.
 * Usage: npm run reset   (WARNING: removes all progress, notes and plan items)
 *
 * IMPORTANT: this file must not import connection.js (directly or indirectly)
 * before the delete — that would open the database, and every later write would
 * land in the deleted file. DB_FILE comes from paths.js, which opens nothing;
 * the connection is created afterwards via the dynamic imports below.
 */
for (const suffix of ['', '-wal', '-shm']) {
  const file = `${DB_FILE}${suffix}`;
  if (fs.existsSync(file)) fs.rmSync(file);
}
console.log('[reset] database removed:', DB_FILE);

const { bootstrapDatabase } = await import('./nodeBootstrap.js');
const { seed } = await import('./seed.js');

bootstrapDatabase();
const created = seed();
console.log('[reset] fresh database ready:', created);
