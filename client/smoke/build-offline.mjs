import path from 'node:path';
import { fileURLToPath } from 'node:url';
import esbuild from 'esbuild';

/**
 * Bundles the offline smoke test for Node.
 *
 * The browser backend resolves the two swapped server modules exactly like the
 * Vite build does (see client/vite.config.js), so this test exercises the same
 * module graph the GitHub Pages deployment uses.
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const browserDb = path.join(root, 'src', 'browser-db');

await esbuild.build({
  entryPoints: [path.join(here, 'bootstrap-offline.mjs')],
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: path.join(here, 'out-offline.mjs'),
  loader: { '.jsx': 'jsx' },
  jsx: 'automatic',
  external: ['jsdom', 'sql.js'],
  // src/lib/env.js reads `import.meta.env`, so the whole object must be
  // defined here (defining a single member would never match that access).
  define: {
    'import.meta.env': JSON.stringify({
      MODE: 'pages',
      BASE_URL: '/',
      VITE_API_MODE: 'local',
      DEV: false,
      PROD: true,
    }),
  },
  plugins: [
    {
      name: 'browser-aliases',
      setup(build) {
        build.onResolve({ filter: /^express$/ }, () => ({ path: path.join(browserDb, 'express-lite.js') }));
        build.onResolve({ filter: /^(?:\.{1,2}\/)+(?:db\/)?connection\.js$/ }, () => ({
          path: path.join(browserDb, 'connectionShim.js'),
        }));
      },
    },
  ],
  logLevel: 'warning',
});

console.log('[build-offline] bundled smoke/out-offline.mjs');
