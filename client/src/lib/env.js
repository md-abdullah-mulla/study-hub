/**
 * Environment access in one place.
 *
 * Vite replaces `import.meta.env.*` at build time, but the same components also
 * run in test bundles (esbuild) where `import.meta.env` does not exist. Going
 * through this helper keeps every usage safe and documents the flags:
 *
 *   VITE_API_MODE=local  → the whole backend runs in the browser (GitHub Pages build)
 *   VITE_API_URL=<url>   → the UI talks to a backend on another host
 */
export const env = import.meta.env ?? {};

/** true when the app hosts its own database (no server) — see browser-db/localApi.js */
export const isLocalApiMode = env.VITE_API_MODE === 'local';
