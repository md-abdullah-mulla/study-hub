import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Post-processing for the GitHub Pages build:
 *
 *  1. copies index.html to 404.html — GitHub Pages serves that file for unknown
 *     paths, which is what makes deep links like /study-hub/subjects/4 work
 *     (React Router then takes over);
 *  2. drops a .nojekyll file so Pages does not run the folder through Jekyll.
 */
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const indexFile = path.join(distDir, 'index.html');

if (!fs.existsSync(indexFile)) {
  console.error('[postbuild-pages] dist/index.html not found — run the build first');
  process.exit(1);
}

fs.copyFileSync(indexFile, path.join(distDir, '404.html'));
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log('[postbuild-pages] wrote 404.html (SPA fallback) and .nojekyll');
