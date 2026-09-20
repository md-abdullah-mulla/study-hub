/**
 * Fetch bridge for browser mode.
 *
 * Kept in its own module (away from the sql.js loader in localApi.js) so it can
 * be unit tested in Node without touching Vite-only imports such as `?url`.
 *
 * Wraps fetch so `/api/*` requests are answered by the in-browser backend;
 * anything else (assets, fonts, external links) goes to the network untouched.
 *
 * @param {(request: {method:string,path:string,search:string,body?:any}) => Promise<{status:number,headers:object,body?:string}>} handle
 */
export function installFetchBridge(handle, { fetchImpl = globalThis.fetch, baseHref } = {}) {
  const originalFetch = fetchImpl.bind(globalThis);
  const href = baseHref ?? (typeof location !== 'undefined' ? location.href : 'http://localhost/');

  const wrapped = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input?.url ?? String(input);
    if (!/\/api(\/|$|\?)/.test(url)) return originalFetch(input, init);

    const parsed = new URL(url, href);
    const apiIndex = parsed.pathname.indexOf('/api/');
    // keep the /api prefix: the in-page router mounts the API exactly like the
    // Node server does (app.use('/api', apiRouter(...)))
    const apiPath = apiIndex === -1 ? '/api' : parsed.pathname.slice(apiIndex);

    const result = await handle({
      method: (init.method ?? 'GET').toUpperCase(),
      path: apiPath,
      search: parsed.search,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    });

    return new Response(result.body ?? null, {
      status: result.status,
      headers: result.headers,
    });
  };

  globalThis.fetch = wrapped;
  return () => {
    globalThis.fetch = originalFetch;
  };
}
