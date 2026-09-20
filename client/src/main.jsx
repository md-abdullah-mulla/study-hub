import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { env, isLocalApiMode } from './lib/env.js';
import './index.css';

/**
 * App entry point.
 *
 * Two ways to run the same UI:
 *  1. Dev / preview / self-hosted server  → API calls go to the Node server
 *     through the Vite proxy (or VITE_API_URL in a split deployment).
 *  2. GitHub Pages build (VITE_API_MODE=local) → sql.js (SQLite in WebAssembly)
 *     starts inside the page and every `/api` call is answered locally, so the
 *     app is fully usable without any server. Data is kept in IndexedDB.
 */
async function start() {
  if (isLocalApiMode) {
    const { installLocalApi } = await import('./browser-db/localApi.js');
    const local = await installLocalApi();
    if (!local.persistent) {
      console.warn(
        '[study-hub] IndexedDB unavailable — data will not survive a reload. Download a JSON backup from Settings.'
      );
    }
  }

  const basename = (env.BASE_URL ?? '/').replace(/\/$/, '') || '/';

  ReactDOMClient.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

start().catch((error) => {
  console.error(error);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="font-family:system-ui,sans-serif;max-width:34rem;margin:15vh auto;padding:1.5rem;
                  border:1px solid #e2e8f0;border-radius:1rem;line-height:1.6">
        <h1 style="margin:0 0 .5rem;font-size:1.1rem">অ্যাপ চালু করা যাচ্ছে না</h1>
        <p style="margin:0 0 .75rem;color:#475569;font-size:.9rem">
          ব্রাউজার স্টোরেজ (IndexedDB) বা WebAssembly block করা থাকলে এমন হয় —
          private/incognito window-এ চেষ্টা করুন, অথবা normal window-এ খুলুন।
        </p>
        <pre style="background:#f8fafc;padding:.75rem;border-radius:.5rem;overflow:auto;font-size:.75rem">${String(
          error?.message ?? error
        )}</pre>
      </div>`;
  }
});
