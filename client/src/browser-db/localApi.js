import initSqlJs from 'sql.js';
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { loadSchemaSql } from './schemaSql.js';
import { saveAsFile } from './download.js';
import { createStorage, registerFlushHandler } from './idbStorage.js';
import { createBrowserBackend } from './backend.js';
import { installFetchBridge } from './fetchBridge.js';

/**
 * Browser-mode entry point (GitHub Pages build).
 *
 * Starts SQLite (WebAssembly) inside the page, loads the saved database from
 * IndexedDB, seeds the Semester 6 structure on first run, and then routes every
 * `/api/...` fetch call to the in-browser backend instead of the network.
 *
 * The rest of the app cannot tell the difference: client/src/api/client.js keeps
 * calling relative `/api` URLs, exactly like it does against the Node server.
 * The dev/preview build simply never calls installLocalApi().
 */
export async function installLocalApi() {
  const storage = await createStorage();
  const savedBytes = await storage.get('database');

  const SQL = await initSqlJs({ locateFile: () => wasmUrl });

  let backend;
  try {
    backend = await createBrowserBackend({
      SQL,
      schemaSql: loadSchemaSql(),
      data: savedBytes,
      storage,
    });
  } catch (error) {
    // A damaged database must never cost the student their data: keep the
    // broken file, start a clean one, and let the recovery screen (main.jsx)
    // offer "restore the latest automatic backup" instead of a blank page.
    console.error('[study-hub] database could not be opened', error);
    globalThis.__STUDY_HUB_DB_ERROR__ = error?.message ?? String(error);
    globalThis.__STUDY_HUB_STORAGE__ = storage;
    if (savedBytes && storage?.set) await storage.set('database-broken', savedBytes);
    await storage?.remove?.('database');
    backend = await createBrowserBackend({ SQL, schemaSql: loadSchemaSql(), data: null, storage });
  }

  const unregisterFlush = registerFlushHandler(() => backend.flush());
  window.addEventListener('pagehide', () => backend.flush());

  const bridge = installFetchBridge(backend.handle);

  // the auto-backup helper (client/src/lib/backup.js) works through these:
  //  - __STUDY_HUB_STORAGE__ to read/write the rolling snapshot copies
  //  - studyHubLocal.backend to export / replace the database file
  globalThis.__STUDY_HUB_STORAGE__ = storage;
  const { loadRecoveryCopyIndex } = await import('../lib/backup.js');
  await loadRecoveryCopyIndex(storage);

  // small helpers for the Settings page and for debugging in the console
  window.studyHubLocal = {
    backend,
    storage,
    downloadBackup: () =>
      saveAsFile('study-backup.json', new TextDecoder().decode(backend.exportBytes()), 'application/json'),
    stop: () => {
      bridge();
      unregisterFlush();
    },
  };

  return { ...backend, storage, persistent: storage.persistent };
}
