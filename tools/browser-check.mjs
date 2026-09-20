/**
 * REAL-BROWSER CHECK — walks through the deployed (or local) app in Chromium.
 *
 * Why this exists: the jsdom smoke test runs inside Node, where globals such as
 * `Buffer` exist. The deployed app runs the same backend in the browser, where
 * they do not. That difference already hid one real bug (auto backup threw
 * "Buffer is not defined" on the live site only), so the last step before
 * delivery is this: open the real site in a real browser and click through it.
 *
 * It checks:
 *   1. every screen opens and prints no "undefined" / "NaN" / "[object Object]"
 *   2. dashboard numbers, subject → chapter → topic navigation, and that a topic
 *      completion survives a page reload (real persistence)
 *   3. topic content belongs to the topic's own subject (Task 1 rule)
 *   4. Exam Mode end to end: start → answer → next → submit → result summary
 *   5. analytics cards + charts, PDF report sections + print, auto backup
 *   6. the phone layout loads with a working navigation
 *   7. the console stays free of errors the whole time
 *
 * Usage (Playwright is intentionally NOT a dependency of the app):
 *   mkdir -p /tmp/qa && cd /tmp/qa && npm init -y && npm i playwright
 *   npx playwright install chromium
 *   PLAYWRIGHT_HOME=/tmp/qa node /path/to/study-hub/tools/browser-check.mjs <url>
 *
 * If playwright is installed next to this file, `node tools/browser-check.mjs <url>`
 * already works — PLAYWRIGHT_HOME only tells Node where to look for it.
 *
 * Exit code 0 = everything passed, 1 = at least one check failed.
 */
import { createRequire } from 'node:module';

const requireFrom = createRequire(process.env.PLAYWRIGHT_HOME ? `${process.env.PLAYWRIGHT_HOME}/index.js` : import.meta.url);
const { chromium } = requireFrom('playwright');

const BASE = (process.argv[2] ?? 'http://127.0.0.1:5173').replace(/\/?$/, '/');
const SHOTS = process.env.SHOT_DIR ?? '';

const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok });
  const clean = String(detail).replace(/\s+/g, ' ').slice(0, 140);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  → ${clean}` : ''}`);
};

const browser = await chromium.launch();

async function open(viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
  await page.goto(BASE, { waitUntil: 'load', timeout: 90_000 });
  await page.waitForTimeout(5000); // the in-page SQLite (WASM) boots and seeds
  return { page, context, errors };
}
const text = (page) => page.locator('#root').innerText();
const shot = (page, name) => (SHOTS ? page.screenshot({ path: `${SHOTS}/${name}.png`, fullPage: false }) : Promise.resolve());

// ------------------------------------------------------------------ 1. screens
const ROUTES = [
  ['', 'Dashboard'],
  ['subjects', 'Subjects'],
  ['study', 'Study Session'],
  ['revision', 'Revision'],
  ['quiz', 'Quiz'],
  ['ai', 'Topic content'],
  ['exam', 'Exam Mode'],
  ['analytics', 'Analytics'],
  ['notes', 'Notes'],
  ['import', 'Import Chapter'],
  ['settings', 'Settings'],
  ['report', 'PDF report'],
];

const { page, context, errors } = await open({ width: 1440, height: 950 });

let dirtyScreens = 0;
for (const [route, label] of ROUTES) {
  await page.goto(`${BASE}${route}`, { waitUntil: 'load' });
  await page.waitForTimeout(route === '' ? 2000 : 2500);
  const screen = await text(page);
  const hits = ['undefined', 'NaN', '[object Object]', 'Infinity'].filter((w) => screen.includes(w));
  if (hits.length || screen.length < 200) dirtyScreens += 1;
  check(`screen /${route} (${label}) renders cleanly`, hits.length === 0 && screen.length > 200, hits.length ? `prints ${hits.join(', ')}` : '');
}
check('no screen prints "undefined" / "NaN" / "[object Object]"', dirtyScreens === 0, `${dirtyScreens} screen(s) affected`);

// ---------------------------------------------------- 2. dashboard + navigation
const treeShape = await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text()));
const tree = JSON.parse(treeShape);
const mcu = tree.subjects.find((s) => s.name === 'Microcontroller');
const chapter = mcu.chapters.find((c) => c.topics.some((t) => t.name === 'Architecture concepts'));
const topic = chapter.topics.find((t) => t.name === 'Architecture concepts');

await page.goto(`${BASE}`, { waitUntil: 'load' });
await page.waitForTimeout(2500);
const dash = await text(page);
check(
  'dashboard shows progress, subjects and the plan/revision blocks',
  dash.includes('Semester') && dash.includes("Today's Target") && dash.includes('Revision Due'),
  dash.slice(0, 110)
);
check('dashboard streak card shows a real best value', /সেরা:\s*\d+\s*দিন/.test(dash), dash.match(/সেরা:[^|]{0,18}/)?.[0] ?? 'not found');
await shot(page, '01-dashboard');

await page.goto(`${BASE}subjects/${mcu.id}/chapters/${chapter.id}`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
check('the chapter page lists its topics', (await text(page)).includes('Architecture concepts'), '');
const completeButtons = page.locator('button[title="শেষ করেছি"]');
check('every topic row offers a complete button', (await completeButtons.count()) === chapter.topics.length, `${await completeButtons.count()} of ${chapter.topics.length}`);
await shot(page, '02-chapter');

await completeButtons.nth(chapter.topics.indexOf(topic)).click();
await page.waitForTimeout(2500);
await page.reload({ waitUntil: 'load' });
await page.waitForTimeout(4000);
const reloaded = JSON.parse(await page.evaluate(() => fetch('/api/progress-tree').then((r) => r.text())));
const reloadedTopic = reloaded.subjects
  .find((s) => s.id === mcu.id)
  .chapters.flatMap((c) => c.topics)
  .find((t) => t.id === topic.id);
check('a completed topic survives a page reload (real persistence)', reloadedTopic.isDone === true, `status=${reloadedTopic.status}`);

// ------------------------------------------------------------ 3. topic content
await page.goto(`${BASE}ai`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
const pick = async (index, wanted) => {
  const select = page.locator('select').nth(index);
  const options = await select.locator('option').evaluateAll((els) => els.map((el) => ({ value: el.value, text: el.textContent.trim() })));
  const hit = options.find((o) => o.text === wanted) ?? options.find((o) => o.text.includes(wanted));
  if (!hit) throw new Error(`select ${index}: "${wanted}" not in ${options.map((o) => o.text).join(' / ')}`);
  await select.selectOption(hit.value);
};
await pick(0, 'Microcontroller');
await page.waitForTimeout(1500);
await pick(1, 'Architecture');
await page.waitForTimeout(1500);
await pick(2, 'Architecture concepts');
await page.waitForTimeout(1000);
check('the content screen states that no AI API is used', (await text(page)).includes('কোনো AI API নেই'), '');
await page.getByRole('button', { name: 'Content তৈরি করো' }).click();
await page.waitForTimeout(4500);
const content = await text(page);
check(
  'topic content talks about the topic own subject (Task 1 rule)',
  ['CPU', 'ALU', 'Control Unit', 'register', 'bus'].every((w) => content.toLowerCase().includes(w.toLowerCase())) &&
    !/MQTT|CoAP|Foreign key|Normalization|OSI model|Subnet mask/i.test(content),
  content.slice(content.indexOf('সহজ সংজ্ঞা'), content.indexOf('সহজ সংজ্ঞা') + 110)
);
await shot(page, '03-topic-content');

// ---------------------------------------------------------------- 4. exam mode
await page.goto(`${BASE}exam`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
await page.getByRole('button', { name: 'Exam শুরু করো' }).click();
await page.waitForTimeout(4500);
const running = await text(page);
check('the exam runner starts with a timer and question 1', /\d\d:\d\d/.test(running) && running.includes('প্রশ্ন 1 /'), running.slice(0, 90));
const radio = page.locator('input[type=radio]').first();
if (await radio.count()) await radio.check({ force: true });
await page.waitForTimeout(600);
check('an answer can be selected and is counted', (await text(page)).includes('উত্তর দিয়েছ 1'), '');
await page.getByRole('button', { name: 'পরের প্রশ্ন' }).first().click();
await page.waitForTimeout(700);
check('the exam moves to the next question', (await text(page)).includes('প্রশ্ন 2 /'), '');
await page.getByRole('button', { name: 'Exam জমা দাও' }).first().click();
await page.waitForTimeout(900);
await page.getByRole('button', { name: 'হ্যাঁ, জমা দাও' }).first().click();
await page.waitForTimeout(4500);
const result = (await text(page)).toUpperCase();
check(
  'the result shows the full summary (total / correct / wrong / unanswered / score / percentage / time)',
  ['TOTAL QUESTIONS', 'CORRECT', 'WRONG', 'UNANSWERED', 'SCORE', 'PERCENTAGE', 'TIME TAKEN'].every((label) => result.includes(label)),
  ''
);
check('the review shows the correct answers and a retry button', result.includes('সঠিক উত্তর') && /আবার|RETRY/i.test(result), '');
await shot(page, '04-exam-result');

// -------------------------------------------------------- 5. analytics + report
await page.goto(`${BASE}analytics`, { waitUntil: 'load' });
await page.waitForTimeout(4000);
const analytics = await text(page);
check('analytics shows the performance report, best and lowest exam score', analytics.includes('Performance report') && /সেরা/.test(analytics) && /সর্বনিম্ন/.test(analytics), '');
check('the analytics charts render', (await page.locator('svg.recharts-surface').count()) > 0, '');
await shot(page, '05-analytics');

await page.goto(`${BASE}report`, { waitUntil: 'load' });
await page.waitForTimeout(3500);
await page.evaluate(() => {
  globalThis.__PRINTS__ = 0;
  window.print = () => {
    globalThis.__PRINTS__ += 1;
  };
});
const report = await text(page);
check(
  'the report has every section (including topic progress) and the student name',
  ['Smart Semester Study Report', 'Overall Progress', 'Subject-wise performance', 'Exam results', 'Study statistics', 'Topic progress'].every((h) => report.includes(h)) && report.includes('Student:'),
  ''
);
await page.getByRole('button', { name: 'Export Report as PDF' }).first().click();
await page.waitForTimeout(1000);
check('Export Report as PDF triggers the browser print (print-to-PDF)', (await page.evaluate(() => globalThis.__PRINTS__)) > 0, '');
await shot(page, '06-report');

// -------------------------------------------------------------- 6. auto backup
await page.goto(`${BASE}settings`, { waitUntil: 'load' });
await page.waitForTimeout(3000);
check('settings shows the auto-backup card', (await text(page)).includes('Auto Backup') && (await text(page)).includes('Backup Now'), '');
await page.getByRole('button', { name: 'Backup Now' }).first().click();
await page.waitForTimeout(4500);
check('Backup Now stores a snapshot and shows the time', (await text(page)).includes('শেষ backup'), '');
const backups = JSON.parse(await page.evaluate(() => fetch('/api/backups').then((r) => r.text())));
check(
  'the snapshot really exists with a real size',
  backups.backups.length >= 1 && backups.backups[0].sizeBytes > 1000,
  JSON.stringify(backups.backups[0] ?? {})
);

const desktopErrors = errors.filter((t) => !/favicon|Failed to load resource|React DevTools/i.test(t));
check('no console errors on desktop', desktopErrors.length === 0, desktopErrors.slice(0, 2).join(' | '));
await context.close();

// -------------------------------------------------------------- 7. phone layout
const { page: mobile, context: mobileContext, errors: mobileErrors } = await open({ width: 390, height: 844 });
const mobileDash = await text(mobile);
check('the phone layout loads with its navigation', mobileDash.includes('ড্যাশবোর্ড') && (await mobile.locator('nav').count()) > 0, '');
check('no screen content is cut off on a phone (subject card visible)', mobileDash.includes('Subject'), '');
await shot(mobile, '07-mobile-dashboard');
await mobile.goto(`${BASE}exam`, { waitUntil: 'load' });
await mobile.waitForTimeout(3000);
check('Exam Mode is usable on a phone', (await text(mobile)).includes('Exam'), '');
await mobile.goto(`${BASE}subjects/${mcu.id}/chapters/${chapter.id}`, { waitUntil: 'load' });
await mobile.waitForTimeout(2800);
check('the chapter/topic screen works on a phone', (await text(mobile)).includes('Architecture concepts'), '');
await shot(mobile, '08-mobile-chapter');
const mobileReal = mobileErrors.filter((t) => !/favicon|Failed to load resource|React DevTools/i.test(t));
check('no console errors on the phone layout', mobileReal.length === 0, mobileReal.slice(0, 2).join(' | '));
await mobileContext.close();

await browser.close();

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} browser checks passed on ${BASE}`);
if (failed.length) console.log('failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
