/**
 * CLI for `npm run seed`: bootstraps the schema (Node entry) and inserts the
 * Semester 6 structure. Kept separate from seed.js so that seed.js stays a pure
 * module the browser build can import.
 */
import { bootstrapDatabase } from './nodeBootstrap.js';
import { seed } from './seed.js';

bootstrapDatabase();
const created = seed();
console.log('[seed] done:', created);
