/**
 * APP VERSION (PWA) CHECK — real Chromium, against the deployed site or a local build.
 *
 * What it proves: the browser accepts the manifest as an installable app, the
 * icons load, the service worker takes control, and with the network switched OFF
 * the app still opens (dashboard + a deep link such as /exam) and can still save
 * changes — which is exactly what "App version" means to a student.
 *
 * Run:
 *   PLAYWRIGHT_HOME=/tmp/qa node tools/pwa-check.mjs https://study-hub-virid.vercel.app/
 *   PLAYWRIGHT_HOME=/tmp/qa node tools/pwa-check.mjs http://127.0.0.1:4174/
 */
import { createRequire } from 'node:module';

// Playwright is a QA tool, not an app dependency — PLAYWRIGHT_HOME points at a
// folder where it is installed (see tools/README-bn.md).
const requireFrom = createRequire(process.env.PLAYWRIGHT_HOME ? `${process.env.PLAYWRIGHT_HOME}/index.js` : import.meta.url);
const { chromium } = requireFrom('playwright');

const BASE = (process.argv[2] ?? 'http://127.0.0.1:4173/').replace(/\/?$/, '/');
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  → ${String(detail).replace(/\s+/g, ' ').slice(0, 190)}` : ''}`);
};

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(5000);

const cdp = await context.newCDPSession(page);
const manifest = await cdp.send('Page.getAppManifest');
check('the browser loads the web app manifest', Boolean(manifest.data) && String(manifest.url).includes('manifest.webmanifest'), manifest.url);
check('the manifest has no errors', (manifest.errors ?? []).length === 0, JSON.stringify(manifest.errors ?? []));
const parsed = JSON.parse(manifest.data ?? '{}');
check('manifest says standalone + proper name', parsed.display === 'standalone' && /Study Hub/.test(parsed.name), `${parsed.name} | ${parsed.display}`);
check(
  'manifest carries 512px + maskable icons',
  (parsed.icons ?? []).some((i) => i.sizes === '512x512') && (parsed.icons ?? []).some((i) => String(i.purpose).includes('maskable')),
  `${(parsed.icons ?? []).length} icons`
);

const installability = await cdp.send('Page.getInstallabilityErrors').catch((error) => ({ installabilityErrors: [{ errorId: error.message }] }));
const installErrors = (installability.installabilityErrors ?? []).filter((e) => e.errorId !== 'not-in-main-frame');
check('Chrome finds nothing blocking installation', installErrors.length === 0, JSON.stringify(installErrors));

const iconStatus = await page.evaluate(async (manifestUrl) => {
  const base = new URL(manifestUrl, location.href);
  const data = await (await fetch(base)).json();
  const out = {};
  for (const icon of data.icons) {
    const res = await fetch(new URL(icon.src, base));
    out[icon.src] = `${res.status} ${res.headers.get('content-type')}`;
  }
  return out;
}, manifest.url);
check('every manifest icon really loads as a PNG', Object.values(iconStatus).every((v) => v.startsWith('200 image/png')), JSON.stringify(iconStatus));

await page.waitForTimeout(2500);
const sw = await page.evaluate(async () => {
  const reg = await navigator.serviceWorker.getRegistration();
  return { scope: reg?.scope ?? null, active: Boolean(reg?.active) };
});
check('the service worker registers', Boolean(sw.scope) && sw.active, JSON.stringify(sw));

await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(4000);
check('the page is served by the service worker (offline copy exists)', await page.evaluate(() => Boolean(navigator.serviceWorker.controller)), '');

// ---- offline ----
await context.setOffline(true);
await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(6000);
const offlineDash = await page.locator('#root').innerText();
check('offline: the app still opens', offlineDash.includes('Study Hub') && offlineDash.includes('Semester'), offlineDash.slice(0, 100));

await page.goto(`${BASE}exam`, { waitUntil: 'load' });
await page.waitForTimeout(5000);
check('offline: a deep link (Exam Mode) opens too', (await page.locator('#root').innerText()).includes('Exam'), '');

const apiStatus = await page.evaluate(() => fetch('/api/dashboard').then((r) => r.status));
check('offline: the in-page backend still answers', apiStatus === 200, `GET /api/dashboard → ${apiStatus}`);

await page.goto(BASE, { waitUntil: 'load' });
await page.waitForTimeout(5000);
const tree = JSON.parse(await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text())));
const subject = tree.subjects.find((s) => s.name === 'Microcontroller');
const topic = subject.chapters[0].topics[0];
await page.evaluate(
  ([id]) =>
    fetch(`/api/topics/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    }),
  [topic.id]
);
await page.waitForTimeout(1500);
const after = JSON.parse(await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text())));
const done = after.subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics)).find((t) => t.id === topic.id);
check('offline: marking a topic complete works and is saved', done.status === 'completed', `status=${done.status}`);

await context.setOffline(false);
const realErrors = errors.filter((t) => !/favicon|Failed to load resource/i.test(t));
check('no page errors during the app checks', realErrors.length === 0, realErrors.slice(0, 2).join(' | '));

await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} app (PWA) checks passed on ${BASE}`);
if (failed.length) console.log('failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
