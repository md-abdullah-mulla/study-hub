import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));
const browserDbDir = path.join(here, 'src', 'browser-db');

/**
 * Every build stamps `public/sw.js` (the service worker) with a fresh id.
 *
 * The worker keeps a copy of the app so the installed app works offline; the id
 * makes each deploy a NEW cache, so the old one is dropped on activate and the
 * "নতুন version এসেছে" banner can pop up. Without it, an installed app would
 * happily serve yesterday's code for ever.
 */
function serviceWorkerVersionPlugin() {
  return {
    name: 'study-hub:service-worker-version',
    apply: 'build',
    writeBundle(options) {
      const file = path.join(options.dir ?? 'dist', 'sw.js');
      if (!fs.existsSync(file)) return;
      const stamp = `${new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
      fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replaceAll('__BUILD__', stamp));
    },
  };
}

export default defineConfig(({ mode }) => {
  // Two static builds run the whole backend (SQLite as WebAssembly) inside the
  // page, so the app needs no server at all:
  //   --mode pages   → GitHub Pages, served from /study-hub/
  //   --mode vercel  → Vercel, served from the domain root
  //   --mode desktop → the packaged desktop app (Electron), served from app://study-hub/
  const isPages = mode === 'pages';
  const isVercel = mode === 'vercel';
  const isDesktop = mode === 'desktop';

  return {
    // Pages serves the app from /study-hub/; the dev server and other hosts use /
    base: isPages ? '/study-hub/' : '/', // vercel + dev both live at the root

    plugins: [react(), serviceWorkerVersionPlugin()],

    resolve: {
      alias: [
        // The browser build swaps exactly two entry points of the server code and
        // leaves every route, service and repository untouched:
        //   express            -> express-lite (a ~150 line Router for the browser)
        //   db/connection.js   -> connectionShim (same `db` API on top of sql.js)
        { find: 'express', replacement: path.join(browserDbDir, 'express-lite.js') },
        // matches './connection.js', '../db/connection.js', '../../db/connection.js' …
        // (the regex must cover the WHOLE specifier, otherwise only the matched part is replaced)
        { find: /^(?:\.{1,2}\/)+(?:db\/)?connection\.js$/, replacement: path.join(browserDbDir, 'connectionShim.js') },
      ],
    },

    server: {
      host: '0.0.0.0', // the preview needs to bind outside localhost
      port: 5173,
      strictPort: true,
      allowedHosts: true, // the preview proxy uses a generated hostname
      fs: {
        // the UI imports shared code (and schema.sql) from ../server
        allow: [here, path.join(here, '..', 'server')],
      },
      proxy: {
        // one origin for the browser: /api -> Express (no CORS, no hardcoded localhost)
        '/api': {
          target: process.env.API_URL ?? 'http://127.0.0.1:4000',
          changeOrigin: true,
        },
      },
    },

    define: {
      // the app version shown in Settings comes from package.json — one place to bump
      __APP_VERSION__: JSON.stringify(JSON.parse(fs.readFileSync(path.join(here, 'package.json'), 'utf8')).version),
    },

    build: {
      outDir: isDesktop ? 'dist-desktop' : isVercel ? 'dist-vercel' : 'dist',
      chunkSizeWarningLimit: 1600, // sql.js (the in-browser SQLite) is a large chunk by design
    },
  };
});
