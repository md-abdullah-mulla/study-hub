import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

/** Project root = .../study-hub */
export const ROOT_DIR = path.resolve(here, '..', '..');

export const config = {
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  /** SQLite file. Later: swap with DATABASE_URL + postgres adapter in db/connection.js */
  dbFile: process.env.DB_FILE ?? path.join(ROOT_DIR, 'data', 'study.db'),
  /** Phase-1 runs as a single local user (auth comes in a later phase). */
  defaultUser: {
    id: 1,
    name: 'Student',
    email: 'student@local',
  },
};

/** Revision schedule (days after previous stage). Change only here. */
export const REVISION_INTERVALS_DAYS = {
  learned: 3,
  revision_1: 7,
  revision_2: 14,
  final: null,
};
