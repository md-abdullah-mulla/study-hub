import { env } from '../lib/env.js';

const BASE = `${env.VITE_API_URL ?? ''}/api`;

/**
 * Tiny API client. Every network call in the app goes through here so the
 * base URL / headers / error handling live in one place.
 *
 * Local development: VITE_API_URL is empty, so calls go to the relative
 * "/api" path and Vite proxies them to the Express server (see vite.config.js).
 * Deployed hosting: set VITE_API_URL to the backend URL (e.g. Render) at build
 * time and the browser talks to that server directly.
 */

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

async function request(path, { method = 'GET', body } = {}) {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return null;

  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = isJson ? payload?.error ?? 'Request failed' : 'Request failed';
    throw new ApiError(message, response.status, isJson ? payload?.details : undefined);
  }
  return payload;
}

const qs = (params = {}) => {
  const search = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  return search ? `?${search}` : '';
};

export const api = {
  meta: () => request('/meta'),
  dashboard: (date) => request(`/dashboard${qs({ date })}`),
  progressTree: () => request('/progress-tree'),

  subjects: {
    create: (data) => request('/subjects', { method: 'POST', body: data }),
    update: (id, data) => request(`/subjects/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/subjects/${id}`, { method: 'DELETE' }),
  },

  chapters: {
    create: (data) => request('/chapters', { method: 'POST', body: data }),
    update: (id, data) => request(`/chapters/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/chapters/${id}`, { method: 'DELETE' }),
    bulkStatus: (subjectId, chapterId, status) =>
      request(`/subjects/${subjectId}/chapters/${chapterId}/status`, { method: 'PATCH', body: { status } }),
  },

  topics: {
    create: (data) => request('/topics', { method: 'POST', body: data }),
    update: (id, data) => request(`/topics/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/topics/${id}`, { method: 'DELETE' }),
    setStatus: (id, status) => request(`/topics/${id}/status`, { method: 'PATCH', body: { status } }),
    completeRevision: (id) => request(`/topics/${id}/revision/complete`, { method: 'POST', body: {} }),
    reorder: (topicIds) => request('/topics/reorder/bulk', { method: 'PATCH', body: { topicIds } }),
  },

  notes: {
    list: (params) => request(`/notes${qs(params)}`),
    create: (data) => request('/notes', { method: 'POST', body: data }),
    update: (id, data) => request(`/notes/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/notes/${id}`, { method: 'DELETE' }),
  },

  plan: {
    list: (date) => request(`/plan${qs({ date })}`),
    add: (data) => request('/plan', { method: 'POST', body: data }),
    setDone: (id, isDone) => request(`/plan/${id}`, { method: 'PATCH', body: { isDone } }),
    remove: (id) => request(`/plan/${id}`, { method: 'DELETE' }),
    regenerate: () => request('/plan/regenerate', { method: 'POST', body: {} }),
  },

  sessions: {
    list: (params) => request(`/sessions${qs(params)}`),
    active: () => request('/sessions/active'),
    start: (data) => request('/sessions', { method: 'POST', body: data }),
    finish: (id, data) => request(`/sessions/${id}`, { method: 'PATCH', body: data }),
    remove: (id) => request(`/sessions/${id}`, { method: 'DELETE' }),
  },

  search: (q) => request(`/search${qs({ q })}`),
  importParse: (text) => request('/import/parse', { method: 'POST', body: { text } }),
  importApply: (payload) => request('/import/apply', { method: 'POST', body: payload }),
  backupUrl: `${BASE}/export/backup`,
  csvUrl: `${BASE}/export/topics.csv`,
};
