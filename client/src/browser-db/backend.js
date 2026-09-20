import { createSqlJsDatabase } from './sqljsAdapter.js';
import { bindDatabase } from './connectionShim.js';
import { createRouter, createRequest, createResponse, errorResponse } from './express-lite.js';
import { config } from '../../../server/src/config.js';

/**
 * The whole backend, running in the browser (or in a Node test).
 *
 * It mounts exactly the same router the Node server mounts
 * (server/src/routes/index.js → apiRouter), so every rule — progress maths,
 * recommendation scoring, revision schedule, import parsing, validation — is
 * shared code. Only the two entry points of the real app are imitated here:
 * the `/api` mount and the JSON 404 handler from server/src/app.js.
 *
 * @param {object} options
 * @param {any} options.SQL            initialised sql.js module
 * @param {string} options.schemaSql   contents of server/src/db/schema.sql
 * @param {Uint8Array|null} [options.data]      previously saved database bytes
 * @param {object} [options.storage]   { get, set } persistence (IndexedDB)
 */
export async function createBrowserBackend({ SQL, schemaSql, data = null, storage = null, storageKey = 'database' }) {
  const database = createSqlJsDatabase({
    SQL,
    data,
    onPersist: storage ? (bytes) => storage.set(storageKey, bytes) : undefined,
  });

  bindDatabase(database);

  const { bootstrapFromSql } = await import('../../../server/src/db/migrate.js');
  const { seed } = await import('../../../server/src/db/seed.js');
  const { apiRouter } = await import('../../../server/src/routes/index.js');

  bootstrapFromSql(schemaSql);

  // idempotent: creates the Semester 6 structure the first time, does nothing after
  const seeded = seed({ silent: true });
  database.flush();

  const app = createRouter();
  const getUserId = (request) => {
    const header = request.header('x-user-id');
    const parsed = header ? Number(header) : NaN;
    return Number.isInteger(parsed) ? parsed : config.defaultUser.id;
  };

  app.use('/api', apiRouter({ getUserId }));

  const handle = async ({ method = 'GET', path = '/', search = '', body, headers = {} }) => {
    const response = createResponse();
    try {
      const answered = await app.handle(createRequest({ method, path, search, body, headers }), response);
      if (!answered) {
        return {
          status: 404,
          headers: { 'content-type': 'application/json; charset=utf-8' },
          body: JSON.stringify({ error: 'Route not found' }),
        };
      }
      return { status: response.statusCode, headers: response.headers, body: response.body };
    } catch (error) {
      return errorResponse(error);
    }
  };

  return {
    handle,
    database,
    seeded,
    flush: () => database.flush(),
    exportBytes: () => database.export(),
    /** Used by the auto-backup restore: swap the database file and reload. */
    replaceDatabase: (bytes) => database.replaceWith(bytes),
  };
}
