/**
 * Configuration in one place.
 *
 * This module is deliberately PURE (no Node built-ins, no file paths) because
 * the browser build (GitHub Pages mode) imports it too — see
 * client/src/browser-db/. Anything Node-only (the SQLite file path) lives in
 * db/connection.js, and the web-client folder path lives in app.js.
 */
const env = globalThis.process?.env ?? {};
const safeNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const config = {
  env: env.NODE_ENV ?? 'development',
  port: safeNumber(env.PORT, 4000),
  /** Human readable database name, shown in logs and the /api/meta route. */
  databaseLabel: 'sqlite',
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
