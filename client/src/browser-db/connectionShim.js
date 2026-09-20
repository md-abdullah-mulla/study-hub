/**
 * Drop-in replacement for server/src/db/connection.js in the browser build
 * (wired through a Vite alias — see client/vite.config.js).
 *
 * The repositories and services import `{ db }` from their local connection
 * module; here `db` is a proxy that forwards every call to whatever database the
 * browser bootstrap created (sql.js). That is the whole trick that lets the same
 * data layer run on the server and in the browser.
 */
let currentDatabase = null;

/** Called once by the browser bootstrap before any route runs. */
export function bindDatabase(database) {
  currentDatabase = database;
}

function requireDatabase() {
  if (!currentDatabase) {
    throw new Error(
      'Browser database is not ready yet — call installLocalApi() from src/browser-db/localApi.js before using the app.'
    );
  }
  return currentDatabase;
}

const proxy = new Proxy(
  {},
  {
    get(_target, property) {
      const database = requireDatabase();
      const value = database[property];
      return typeof value === 'function' ? value.bind(database) : value;
    },
  }
);

export const db = proxy;

export const dbFile = 'indexeddb://study-hub/database';

export function runInTransaction(work) {
  return requireDatabase().transaction(work)();
}
