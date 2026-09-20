import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const here = path.dirname(fileURLToPath(import.meta.url));
const browserDbDir = path.join(here, 'src', 'browser-db');

export default defineConfig(({ mode }) => {
  // Two static builds run the whole backend (SQLite as WebAssembly) inside the
  // page, so the app needs no server at all:
  //   --mode pages  → GitHub Pages, served from /study-hub/
  //   --mode vercel → Vercel, served from the domain root
  const isPages = mode === 'pages';
  const isVercel = mode === 'vercel';

  return {
    // Pages serves the app from /study-hub/; the dev server and other hosts use /
    base: isPages ? '/study-hub/' : '/', // vercel + dev both live at the root

    plugins: [react()],

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

    build: {
      outDir: isVercel ? 'dist-vercel' : 'dist',
      chunkSizeWarningLimit: 1600, // sql.js (the in-browser SQLite) is a large chunk by design
    },
  };
});
