// The database schema, imported as text so the browser build does not need fs.
// Vite inlines it at build time (`?raw`), which keeps ONE source of truth:
// server/src/db/schema.sql is used by the Node server and by the Pages build.
import schemaSql from '../../../server/src/db/schema.sql?raw';

export function loadSchemaSql() {
  return schemaSql;
}
