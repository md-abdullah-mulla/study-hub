/**
 * Copies the built web app into `desktop/app` so the desktop build ships with it.
 *
 * The desktop app does not talk to a server: it serves these files over its own
 * `app://` address. The web build is made by the client package
 * (`cd client && npm run build:desktop`), and this script refuses to run on a
 * stale/missing build instead of packaging an empty app.
 *
 * Run:  node scripts/prepare-app.mjs   (called automatically by every desktop script)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const desktopDir = path.resolve(here, '..');
const source = path.resolve(desktopDir, '..', 'client', 'dist-desktop');
const target = path.join(desktopDir, 'app');

function fail(message) {
  console.error(`\n[desktop] ${message}\n`);
  process.exit(1);
}

if (!fs.existsSync(path.join(source, 'index.html'))) {
  fail(`client web build not found at:\n  ${source}\n\nBuild it first:\n  cd client && npm run build:desktop`);
}

const wasm = fs.existsSync(path.join(source, 'assets'))
  ? fs.readdirSync(path.join(source, 'assets')).some((file) => file.endsWith('.wasm'))
  : false;
if (!wasm) fail('the web build has no .wasm file — SQLite (WebAssembly) is missing, the app would not start offline.');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true });

const files = fs.readdirSync(target).length;
const bytes = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce((total, entry) => {
    const full = path.join(dir, entry.name);
    return total + (entry.isDirectory() ? bytes(full) : fs.statSync(full).size);
  }, 0);

fs.writeFileSync(
  path.join(target, 'build-info.json'),
  JSON.stringify({ preparedAt: new Date().toISOString(), files, bytes: bytes(target) }, null, 2)
);

console.log(`[desktop] web app copied → desktop/app  (${files} entries, ${(bytes(target) / 1024 / 1024).toFixed(1)} MB)`);
