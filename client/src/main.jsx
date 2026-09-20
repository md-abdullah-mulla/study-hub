import React from 'react';
import ReactDOMClient from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { env, isLocalApiMode } from './lib/env.js';
import { registerServiceWorker } from './lib/pwa.js';
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
/**
 * Shown when the saved database could not be opened (file damaged, storage
 * full, interrupted write). The student gets a way back instead of a blank
 * screen: the newest recovery copy lives *outside* the database, so it still
 * works even now.
 */
function renderRecoveryScreen(errorMessage) {
  const root = document.getElementById('root');
  root.innerHTML = `
    <div style="font-family:system-ui,sans-serif;max-width:36rem;margin:12vh auto;padding:1.5rem;
                border:1px solid #fde68a;background:#fffbeb;border-radius:1rem;line-height:1.7">
      <h1 style="margin:0 0 .5rem;font-size:1.1rem">তোমার saved data খোলা যাচ্ছে না</h1>
      <p style="margin:0 0 .75rem;color:#475569;font-size:.92rem">
        ব্রাউজারের ভেতরের database ফাইলটি হয়তো ঠিকভাবে save হয়নি। চিন্তার কিছু নেই —
        auto backup-এর একটা copy database-এর বাইরে আলাদা করে রাখা আছে, সেটা দিয়ে ফিরিয়ে আনা যায়।
      </p>
      <pre style="background:#fff;padding:.6rem;border-radius:.5rem;overflow:auto;font-size:.72rem;color:#92400e">${String(
        errorMessage ?? ''
      )}</pre>
      <div style="display:flex;gap:.5rem;flex-wrap:wrap;margin-top:1rem">
        <button id="restore-backup" style="background:#2554e0;color:#fff;border:0;border-radius:.6rem;padding:.55rem 1rem;font-size:.9rem;cursor:pointer">
          সর্বশেষ backup ফিরিয়ে আনো
        </button>
        <button id="start-fresh" style="background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:.6rem;padding:.55rem 1rem;font-size:.9rem;cursor:pointer">
          নতুন করে শুরু করো
        </button>
      </div>
      <p id="recovery-status" style="margin:.75rem 0 0;font-size:.85rem;color:#475569"></p>
    </div>`;

  document.getElementById('start-fresh').addEventListener('click', () => window.location.reload());
  document.getElementById('restore-backup').addEventListener('click', async () => {
    const status = document.getElementById('recovery-status');
    status.textContent = 'Backup থেকে ফিরিয়ে আনা হচ্ছে...';
    const { restoreFromRecoveryCopy } = await import('./lib/backup.js');
    const result = await restoreFromRecoveryCopy();
    status.textContent = result.ok
      ? 'সফল হয়েছে — page আবার load হচ্ছে...'
      : `পারা গেল না: ${result.error}. তুমি Settings → Backup (JSON) থেকে ফাইল থেকেও ফিরিয়ে আনতে পারো।`;
    if (result.ok) setTimeout(() => window.location.reload(), 900);
  });
}

async function start() {
  // App version: keep a copy of the app itself, so the installed app opens
  // instantly and works with no internet. The "new version ready" banner is
  // handled by UpdateBanner (it calls registerServiceWorker itself); here we
  // only make sure the worker is registered even if that component never mounts.
  registerServiceWorker();

  if (isLocalApiMode) {
    const { installLocalApi } = await import('./browser-db/localApi.js');
    const local = await installLocalApi();
    if (!local.persistent) {
      console.warn(
        '[study-hub] IndexedDB unavailable — data will not survive a reload. Download a JSON backup from Settings.'
      );
    }
    if (globalThis.__STUDY_HUB_DB_ERROR__) {
      renderRecoveryScreen(globalThis.__STUDY_HUB_DB_ERROR__);
      return;
    }
  }

  // Phase 5: automatic backup. Runs once per app start, and silently — the
  // Settings page shows the result. A failure must never block the app.
  import('./lib/backup.js')
    .then(({ autoBackupIfDue }) => autoBackupIfDue())
    .then((result) => {
      if (result?.created) console.info('[study-hub] automatic backup taken');
    })
    .catch((error) => console.warn('[study-hub] automatic backup skipped:', error.message));

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
