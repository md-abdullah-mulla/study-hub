/**
 * Minimal Express-compatible router (Router / app) for the browser build.
 *
 * On GitHub Pages there is no Node process, so instead of bundling Express
 * (which needs fs, streams, http...) the app is served by this tiny router.
 * Only the features our own route files use are implemented, and the route
 * files themselves are imported unchanged:
 *
 *   router.get|post|patch|delete(path, ...handlers)
 *   router.use(prefix, childRouter)
 *   req:  method, path, params, query, body, headers, header(name)
 *   res:  status(code), setHeader, json, send, end
 *
 * Everything else (validation, services, repositories) is the same code the
 * Node server runs, so behaviour cannot drift.
 */
import { HttpError } from '../../../server/src/utils/http.js';

function pathToMatcher(pattern) {
  const keys = [];
  const cleaned = pattern.replace(/\/+$/, '');
  const source = cleaned
    .split('/')
    .map((segment) => {
      if (!segment) return '';
      if (segment.startsWith(':')) {
        keys.push(segment.slice(1));
        return '([^/]+)';
      }
      return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    })
    .join('/');

  return { regex: new RegExp(`^${source || ''}/?$`), keys };
}

function parseQuery(search = '') {
  const query = {};
  for (const [key, value] of new URLSearchParams(search).entries()) {
    if (!(key in query)) query[key] = value;
  }
  return query;
}

export function createRouter() {
  const layers = [];

  const register = (method, pattern, handlers) => {
    layers.push({ kind: 'route', method, ...pathToMatcher(pattern), handlers });
  };

  const router = {
    get: (path, ...handlers) => register('GET', path, handlers),
    post: (path, ...handlers) => register('POST', path, handlers),
    patch: (path, ...handlers) => register('PATCH', path, handlers),
    delete: (path, ...handlers) => register('DELETE', path, handlers),

    /** Supports router.use(prefix, childRouter) — the only form this app uses. */
    use(prefix, child) {
      if (typeof prefix === 'function' || child === undefined) {
        layers.push({ kind: 'middleware', handlers: [prefix, child].filter(Boolean) });
        return router;
      }
      layers.push({ kind: 'mount', prefix: prefix.replace(/\/+$/, ''), router: child });
      return router;
    },

    /** Runs one request through this router. Returns true when it answered. */
    async handle(request, response) {
      const path = request.path === '' ? '/' : request.path;

      for (const layer of layers) {
        if (layer.kind === 'mount') {
          if (path !== layer.prefix && !path.startsWith(`${layer.prefix}/`)) continue;
          const remainder = path.slice(layer.prefix.length) || '/';
          if (await layer.router.handle({ ...request, path: remainder }, response)) return true;
          continue;
        }

        if (layer.kind === 'middleware') {
          await run(layer.handlers, request, response);
          if (response.finished) return true;
          continue;
        }

        if (layer.method !== request.method) continue;
        const match = layer.regex.exec(path);
        if (!match) continue;

        const params = { ...request.params };
        layer.keys.forEach((key, index) => {
          params[key] = decodeURIComponent(match[index + 1]);
        });
        await run(layer.handlers, { ...request, params }, response);
        return true;
      }

      return false;
    },
  };

  /** handler chain with next(err) support, identical in spirit to Express */
  async function run(handlers, request, response) {
    let cursor = -1;

    const next = async (error) => {
      cursor += 1;
      const handler = handlers[cursor];
      if (!handler) {
        if (error) throw error;
        return undefined;
      }
      if (error) {
        if (handler.length === 4) return handler(error, request, response, next);
        return next(error);
      }
      try {
        return await handler(request, response, next);
      } catch (thrown) {
        return next(thrown);
      }
    };

    return next();
  }

  return router;
}

/**
 * Express-compatible exports.
 * Route files do `import { Router } from 'express'`, so the same name must exist
 * here; `express()` itself (used by server/src/app.js, which the browser build
 * does not need) is provided for completeness.
 */
export function Router() {
  return createRouter();
}

export default function express() {
  return createRouter();
}

/** Request/response helpers used by the local API entry point. */
export function createRequest({ method, path, search = '', body, params = {}, headers = {} }) {
  return {
    method: method.toUpperCase(),
    path,
    params,
    body,
    headers,
    query: parseQuery(search),
    header(name) {
      return headers[String(name).toLowerCase()];
    },
  };
}

export function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    body: undefined,
    finished: false,
    status(code) {
      this.statusCode = code;
      return this;
    },
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
      return this;
    },
    json(payload) {
      this.headers['content-type'] = 'application/json; charset=utf-8';
      this.body = JSON.stringify(payload);
      this.finished = true;
      return this;
    },
    send(payload) {
      this.body = typeof payload === 'string' ? payload : JSON.stringify(payload);
      this.finished = true;
      return this;
    },
    end(payload) {
      if (payload !== undefined) this.body = payload;
      this.finished = true;
      return this;
    },
  };
}

export function errorResponse(error) {
  const status = error instanceof HttpError ? error.status : error?.status ?? 500;
  if (status === 500 && typeof console !== 'undefined') console.error('[local-api]', error);
  return {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
    body: JSON.stringify({ error: error?.message ?? 'Unexpected server error', details: error?.details }),
  };
}
