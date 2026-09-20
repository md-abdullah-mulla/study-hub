/**
 * Bootstrap for the OFFLINE smoke test (`npm run smoke:offline`).
 *
 * Prepares jsdom, then starts the browser-mode backend (sql.js in WebAssembly +
 * the shared Express routes) and points fetch at it, so the real UI can be
 * rendered and clicked with NO server running — exactly like the GitHub Pages
 * deployment behaves.
 */
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';

const here = path.dirname(fileURLToPath(import.meta.url));

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: 'http://localhost:5173/',
  pretendToBeVisual: true,
});

globalThis.window = dom.window;
globalThis.document = dom.window.document;
globalThis.navigator = dom.window.navigator;
globalThis.HTMLElement = dom.window.HTMLElement;
globalThis.HTMLInputElement = dom.window.HTMLInputElement;
globalThis.HTMLTextAreaElement = dom.window.HTMLTextAreaElement;
globalThis.Element = dom.window.Element;
globalThis.Node = dom.window.Node;
globalThis.Event = dom.window.Event;
globalThis.KeyboardEvent = dom.window.KeyboardEvent;
globalThis.MouseEvent = dom.window.MouseEvent;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
globalThis.__JSDOM__ = dom;

Object.defineProperty(dom.window.Document.prototype, 'oninput', { value: null, writable: true, configurable: true });
dom.window.Element.prototype.attachEvent ??= function attachEvent() {};
dom.window.Element.prototype.detachEvent ??= function detachEvent() {};
dom.window.scrollTo = () => {};
dom.window.URL.createObjectURL ??= () => 'blob:test';
dom.window.URL.revokeObjectURL ??= () => {};
globalThis.URL.createObjectURL ??= () => 'blob:test';
globalThis.URL.revokeObjectURL ??= () => {};
globalThis.ResizeObserver = dom.window.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

// ---- start the in-browser backend, just like the GitHub Pages build does ----
const { createBrowserBackend } = await import('../src/browser-db/backend.js');
const { installFetchBridge } = await import('../src/browser-db/fetchBridge.js');

const schemaSql = fs.readFileSync(path.resolve(here, '..', '..', 'server', 'src', 'db', 'schema.sql'), 'utf8');
const SQL = await initSqlJs({
  locateFile: () => path.resolve(here, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
});

// in-memory stand-in for IndexedDB (real IndexedDB is a browser API)
const store = new Map();
const storage = {
  persistent: true,
  get: async (key) => store.get(key) ?? null,
  set: async (key, value) => void store.set(key, value),
};

const backend = await createBrowserBackend({ SQL, schemaSql, storage });
installFetchBridge(backend.handle);
globalThis.__OFFLINE_BACKEND__ = backend;
globalThis.__OFFLINE_STORE__ = store;

/**
 * Boots a SECOND backend over the same storage — i.e. what a page reload does.
 * The smoke test uses it to prove that saved sessions really come back from
 * IndexedDB instead of being trusted to stay in memory.
 */
globalThis.__OFFLINE_RELOAD__ = async () => {
  // exactly what src/browser-db/localApi.js does on a page load: read the saved
  // bytes back out of storage and hand them to sql.js
  const savedBytes = await storage.get('database');
  const reloaded = await createBrowserBackend({ SQL, schemaSql, data: savedBytes, storage });
  installFetchBridge(reloaded.handle);
  globalThis.__OFFLINE_BACKEND__ = reloaded;
  return reloaded;
};

await import('./render-offline.jsx');
