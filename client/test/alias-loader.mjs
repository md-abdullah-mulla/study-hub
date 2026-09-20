import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/**
 * Node module-resolution hook that mirrors the Vite aliases used by the
 * GitHub Pages build, so the browser data layer can be tested in plain Node:
 *
 *   express          -> src/browser-db/express-lite.js
 *   **\/connection.js -> src/browser-db/connectionShim.js
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const browserDb = path.resolve(here, '..', 'src', 'browser-db');

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'express') {
    return { url: pathToFileURL(path.join(browserDb, 'express-lite.js')).href, shortCircuit: true };
  }
  if (/(^|\/)connection\.js$/.test(specifier)) {
    return { url: pathToFileURL(path.join(browserDb, 'connectionShim.js')).href, shortCircuit: true };
  }
  return nextResolve(specifier, context);
}
