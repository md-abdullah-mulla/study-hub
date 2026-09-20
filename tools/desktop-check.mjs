/**
 * DESKTOP APP CHECK — drives the real Electron window over Chromium DevTools Protocol.
 *
 * Start the desktop app first (any of these):
 *   cd desktop && npm start                     # dev launch from source
 *   ./release/Study Hub-1.0.0.AppImage --remote-debugging-port=9222 --no-sandbox   # packaged build
 * then run:
 *   node tools/desktop-check.mjs [cdpPort]      # default 9222
 *
 * What it proves about the desktop app:
 *   1. it really runs from its own app:// address (no server, no localhost);
 *   2. it makes ZERO network requests — the app is genuinely offline;
 *   3. the preload bridge works (window.studyHubDesktop) and reports the version;
 *   4. every screen opens, including deep links through the app:// fallback;
 *   5. study data is stored in the desktop app's own folder and survives a reload;
 *   6. the console stays clean.
 */
import { createRequire } from 'node:module';
import fs from 'node:fs';

// Playwright is a QA tool, not an app dependency — PLAYWRIGHT_HOME points at a
// folder where it is installed (see tools/README-bn.md).
const requireFrom = createRequire(process.env.PLAYWRIGHT_HOME ? `${process.env.PLAYWRIGHT_HOME}/index.js` : import.meta.url);
const { chromium } = requireFrom('playwright');

const PORT = process.argv[2] ?? '9222';
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  → ${String(detail).replace(/\s+/g, ' ').slice(0, 170)}` : ''}`);
};

const browser = await chromium.connectOverCDP(`http://127.0.0.1:${PORT}`);
const context = browser.contexts()[0];
const page = context.pages().find((p) => p.url().startsWith('app://')) ?? context.pages()[0];
if (!page) {
  console.error('no window found — is the desktop app running with --remote-debugging-port?');
  process.exit(1);
}

const requests = [];
page.on('request', (request) => requests.push(request.url()));
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

const text = () => page.locator('#root').innerText();
const ROUTES = [
  ['', 'Dashboard'],
  ['exam', 'Exam Mode'],
  ['analytics', 'Analytics'],
  ['report', 'PDF report'],
  ['subjects', 'Subjects'],
  ['ai', 'Topic content'],
  ['settings', 'Settings'],
  ['revision', 'Revision'],
  ['quiz', 'Quiz'],
  ['study', 'Study Session'],
  ['notes', 'Notes'],
  ['import', 'Import Chapter'],
];

await page.waitForTimeout(6000);

check('the window runs from the app:// address', page.url().startsWith('app://study-hub/'), page.url());
check('the desktop bridge is present (preload works)', await page.evaluate(() => globalThis.studyHubDesktop?.isDesktop === true), '');
const info = await page.evaluate(() => globalThis.studyHubDesktop?.info?.());
check('the app reports its own version + data folder', Boolean(info?.version) && Boolean(info?.dataFolder), JSON.stringify(info ?? {}));
check(
  'the data folder really exists on disk (study data lives there)',
  Boolean(info?.dataFolder) && fs.existsSync(info.dataFolder),
  info?.dataFolder ?? ''
);

const dash = await text();
check('the dashboard loads inside the desktop app', dash.includes('Study Hub') && dash.includes('Semester'), dash.slice(0, 90));

// --- every screen, through the app:// SPA fallback (real URLs, not hashes)
let broken = 0;
for (const [route, label] of ROUTES) {
  await page.goto(`app://study-hub/${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(route === '' ? 3000 : 2200);
  const screen = await text();
  const bad = ['undefined', 'NaN', '[object Object]'].filter((word) => screen.includes(word));
  const ok = screen.length > 200 && bad.length === 0;
  if (!ok) broken += 1;
  check(`desktop screen /${route} (${label}) opens`, ok, bad.length ? `prints ${bad.join(', ')}` : screen.slice(0, 80));
}

// --- a missing file must 404 (not silently render the app)
const missing = await page.evaluate(() =>
  fetch('app://study-hub/assets/does-not-exist.js').then((response) => response.status).catch(() => 'threw')
);
check('a missing asset returns 404 instead of a fake page', missing === 404, `status=${missing}`);

// --- path traversal is refused
const traversal = await page.evaluate(() =>
  fetch('app://study-hub/../../package.json')
    .then((response) => response.status)
    .catch(() => 'blocked')
);
check('path traversal outside the app folder is refused', traversal !== 200, `status=${traversal}`);

// --- the desktop app must not need the network at all
const networkRequests = requests.filter((url) => /^https?:/.test(url));
check('the desktop app makes no network requests (truly offline)', networkRequests.length === 0, networkRequests.slice(0, 3).join(' | '));

// --- data lives in the desktop app and survives a reload
await page.goto('app://study-hub/index.html', { waitUntil: 'load' });
await page.waitForTimeout(4000);
const tree = JSON.parse(await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text())));
const subject = tree.subjects.find((s) => s.name === 'Microcontroller') ?? tree.subjects[0];
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
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(5000);
const after = JSON.parse(await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text())));
const stored = after.subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics)).find((t) => t.id === topic.id);
check('study data is saved in the desktop app and survives a reload', stored?.status === 'completed', `status=${stored?.status}`);

const idbFolder = fs.existsSync(info?.dataFolder ?? '') ? fs.readdirSync(info.dataFolder).join(', ') : '';
check('the database files exist in the app data folder', /IndexedDB|Local Storage/.test(idbFolder), idbFolder.slice(0, 120));

const realErrors = errors.filter((t) => !/favicon|Failed to load resource|DevTools|Autofill/i.test(t));
check('no console errors in the desktop app', realErrors.length === 0, realErrors.slice(0, 2).join(' | '));

const shotDir = process.env.SHOT_DIR;
if (shotDir) {
  await page.goto('app://study-hub/index.html', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${shotDir}/desktop-dashboard.png` });
  await page.goto('app://study-hub/analytics', { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  await page.screenshot({ path: `${shotDir}/desktop-analytics.png` });
}

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} desktop checks passed`);
if (failed.length) console.log('failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
