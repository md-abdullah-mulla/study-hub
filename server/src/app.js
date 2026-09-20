import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import cors from 'cors';
import { apiRouter } from './routes/index.js';
import { fileURLToPath } from 'node:url';
import { config } from './config.js';

/** Repo root (.../study-hub) — used only to find the built client in single-service mode. */
const ROOT_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
import { HttpError } from './utils/http.js';

export function createApp() {
  const app = express();

  // Allowed browser origins. Defaults to every origin, which is correct for a
  // local single-user app; set CORS_ORIGIN (comma separated) on a public host
  // when the UI and API live on different domains.
  app.use(
    cors({
      origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()) : true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  /**
   * Phase 1 is a personal, single-user app, so the user id comes from a
   * header (or defaults to the local user). Phase-later auth replaces only
   * this function with JWT/session lookup — no route needs to change.
   */
  const getUserId = (req) => {
    const header = req.header('x-user-id');
    const parsed = header ? Number(header) : NaN;
    return Number.isInteger(parsed) ? parsed : config.defaultUser.id;
  };

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, env: config.env, time: new Date().toISOString() });
  });

  app.use('/api', apiRouter({ getUserId }));

  /**
   * Single-service mode (used by Docker / Render / any Node host):
   * if the client has been built (`client/dist`), Express also serves the web
   * app, so one URL serves both UI and API. During local development the Vite
   * dev server handles the UI instead and this block does nothing.
   */
  const clientDist = path.join(ROOT_DIR, 'client', 'dist');
  const indexHtml = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexHtml)) {
    app.use(express.static(clientDist));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(indexHtml)); // SPA fallback
  }

  app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));

  // eslint-disable-next-line no-unused-vars
  app.use((error, _req, res, _next) => {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error(error);
    res.status(status).json({
      error: error.message ?? 'Unexpected server error',
      details: error.details,
    });
  });

  return app;
}
