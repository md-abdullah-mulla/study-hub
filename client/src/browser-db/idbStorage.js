/**
 * Tiny async key/value store used to keep the SQLite database file in the
 * browser across reloads.
 *
 * Uses IndexedDB (a few MB, structured clone of a Uint8Array) and falls back to
 * memory when IndexedDB is unavailable (private windows, very old browsers) —
 * in that case the app still works, it just forgets after a reload. The Settings
 * page tells the user to download a JSON backup in that situation.
 */
const DB_NAME = 'study-hub';
const STORE = 'kv';

function openIndexedDb(factory) {
  return new Promise((resolve, reject) => {
    const request = factory.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) database.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

if (typeof window !== 'undefined') {
  // make sure pending writes are not lost when the tab closes
  window.addEventListener('pagehide', () => {
    for (const flush of pendingFlushes) flush();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') for (const flush of pendingFlushes) flush();
  });
}

const pendingFlushes = new Set();

export function registerFlushHandler(flush) {
  pendingFlushes.add(flush);
  return () => pendingFlushes.delete(flush);
}

export async function createStorage(factory = globalThis.indexedDB) {
  if (!factory) {
    console.warn('[storage] IndexedDB unavailable — data will only live in memory for this session');
    const memory = new Map();
    return {
      persistent: false,
      get: async (key) => memory.get(key) ?? null,
      set: async (key, value) => memory.set(key, value),
      remove: async (key) => memory.delete(key),
    };
  }

  const database = await openIndexedDb(factory);

  const withStore = (mode, work) =>
    new Promise((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const store = transaction.objectStore(STORE);
      const request = work(store);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

  return {
    persistent: true,
    get: (key) => withStore('readonly', (store) => store.get(key)),
    set: (key, value) => withStore('readwrite', (store) => store.put(value, key)),
    remove: (key) => withStore('readwrite', (store) => store.delete(key)),
  };
}
