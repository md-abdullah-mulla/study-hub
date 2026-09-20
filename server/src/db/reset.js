import fs from 'node:fs';
import { config } from '../config.js';

/**
 * Deletes the local database file and re-seeds the Semester 6 structure.
 * Usage: npm run reset   (WARNING: removes all progress, notes and plan items)
 *
 * NOTE: `seed.js` is imported *after* the files are removed. Importing it at the
 * top of this file would open a database connection first (ESM imports run
 * before this code), and the deletes would then hit an already-open file.
 */
for (const suffix of ['', '-wal', '-shm']) {
  const file = `${config.dbFile}${suffix}`;
  if (fs.existsSync(file)) fs.rmSync(file);
}
console.log('[reset] database removed:', config.dbFile);

const { seed } = await import('./seed.js');
const created = seed();
console.log('[reset] fresh database ready:', created);
