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
  const backend = await createBrowserBackend({
    SQL,
    schemaSql: loadSchemaSql(),
    data: savedBytes,
    storage,
  });

  const unregisterFlush = registerFlushHandler(() => backend.flush());
  window.addEventListener('pagehide', () => backend.flush());

  const bridge = installFetchBridge(backend.handle);

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
