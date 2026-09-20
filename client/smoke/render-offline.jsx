import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

/**
 * OFFLINE / NO-SERVER smoke test (`npm run smoke:offline`).
 *
 * Proves the GitHub Pages build works end to end: the app renders and every
 * action is served by the in-page database (sql.js) through the shared Express
 * routes — no Node server, no network.
 */
const dom = globalThis.__JSDOM__;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const text = () => document.body.textContent.replace(/\s+/g, ' ');
const api = async (path, options) => (await fetch(`/api${path}`, options)).json();

const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  → ${detail}` : ''}`);
}

async function renderAt(path, settle = 1600) {
  document.getElementById('root').innerHTML = '';
  const root = ReactDOMClient.createRoot(document.getElementById('root'));
  await act(async () => {
    root.render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    );
  });
  await act(async () => {
    await wait(settle);
  });
  return root;
}

const byText = (label) => [...document.querySelectorAll('button')].find((el) => el.textContent.includes(label));

async function click(element, settle = 900) {
  if (!element) throw new Error('element not found');
  await act(async () => {
    element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(settle);
  });
}

async function type(element, value) {
  await act(async () => {
    const proto =
      element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
    element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    element.dispatchEvent(new dom.window.KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
    await wait(150);
  });
}

console.log('\n=== Offline (no server) UI smoke test ===\n');

// ---- 1. first run: seeded, honest 0% -------------------------------------
let root = await renderAt('/');
let page = text();
check('app boots with no server (data comes from sql.js in the page)', page.includes('Semester শেষ'));
check('seeded with all 5 Semester 6 subjects', ['Computer Network', 'IoT & IoT Architecture', 'DBMS', 'Microcontroller', 'Security-Based Surveillance System'].every((n) => page.includes(n)));
check('77 topics counted, 0% complete', page.includes('0 / 77 topic complete'));
check("today's plan was generated", page.includes("Today's Target"));
check('recommendation shows its reasons', page.includes('Why this is recommended?'));

// ---- 2. progress updates flow through the in-page database ---------------
const firstPlanBox = document.querySelector('button[aria-label="Done"]');
check('plan item is tickable', Boolean(firstPlanBox));
if (firstPlanBox) {
  await click(firstPlanBox, 1000);
  const plan = await api('/plan');
  check('tick persisted inside the browser database', plan.some((item) => item.isDone));
}

await root.unmount();
root = await renderAt('/subjects/4/chapters/7');
page = text();
check('chapter page renders topic list', page.includes('Topic list') && page.includes('Memory types (ROM/RAM)'));

const completeButton = document.querySelector('button[title="শেষ করেছি"]');
await click(completeButton, 1300);
page = text();
check('chapter recalculated to 25% after one topic', page.includes('Chapter progress (1/4 topic)') && page.includes('25%'), page.slice(0, 0));
const dashboardAfter = await api('/dashboard');
check('semester progress is 1% (1/77)', dashboardAfter.overall.percent === 1);
check('subject progress follows (1/37 → 3%)', dashboardAfter.subjects.find((s) => s.name === 'Microcontroller').progress.percent === 3);

// ---- 3. notes ------------------------------------------------------------
const noteToggle = document.querySelectorAll('button[aria-label="বিস্তারিত"]')[0];
await click(noteToggle, 800);
const noteBox = document.querySelector('textarea[id^="note-"]');
check('note box opens', Boolean(noteBox));
await type(noteBox, 'Offline mode note: RAM memory organization');
await click(byText('নোট যোগ করুন'), 1200);
const notesInDb = await api('/notes');
check('note saved in the in-page database', notesInDb.some((note) => note.body.includes('Offline mode note')) && text().includes('Offline mode note'));

// ---- 4. revision queue ---------------------------------------------------
const revisionButton = document.querySelector('button[title="রিভিশন দরকার"]');
await click(revisionButton, 1300);
const dashboardRevision = await api('/dashboard');
check('revision due badge appears', dashboardRevision.overall.revisionDueCount === 1);

// ---- 5. global search ----------------------------------------------------
await root.unmount();
root = await renderAt('/');
await act(async () => {
  dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await wait(400);
});
check('Ctrl+K opens search', text().includes('Global Search'));
const searchInput = [...document.querySelectorAll('input')].find((input) => input.placeholder?.includes('MQTT'));
await type(searchInput, 'mqtt');
await act(async () => {
  await wait(1200);
});
check('search finds MQTT in the local database', text().includes('MQTT'));
await act(async () => {
  document.querySelector('button[aria-label="বন্ধ করুন"]')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(300);
});

// ---- 6. import chapter ---------------------------------------------------
await root.unmount();
root = await renderAt('/import');
const importBox = document.querySelector('textarea');
await type(importBox, 'Subject: Offline QA Subject\nChapter: Chapter 1\nTopics:\n- Alpha\n- Beta\n- Gamma');
await click(byText('Structure তৈরি করুন'), 1800);
check('import preview parsed the pasted list', text().includes('Alpha') && text().includes('Offline QA Subject'));
await click(byText('Save করুন'), 2200);
const tree = await api('/progress-tree');
const offlineSubject = tree.subjects.find((s) => s.name === 'Offline QA Subject');
check('import created subject + 3 topics in the browser database', offlineSubject?.progress.total === 3, JSON.stringify(offlineSubject?.progress));

// ---- 7. reload: data must survive ---------------------------------------
globalThis.__OFFLINE_BACKEND__.flush();
const savedBytes = await globalThis.__OFFLINE_STORE__.get('database');
check('database bytes were written to (fake) IndexedDB', Boolean(savedBytes && savedBytes.length > 0));

// ---- 8. settings / export tiles -----------------------------------------
await root.unmount();
root = await renderAt('/settings');
page = text();
check('settings show export tiles', page.includes('Backup (JSON)') && page.includes('Topic list (CSV)'));
check('settings explain that data lives in the browser', page.includes('IndexedDB'));
await click(byText('Backup (JSON)'), 1400);
check('backup export runs without a server', text().includes('download হয়েছে') || text().includes('study-backup.json'));

// ---- 9. later-phase screens stay honest ---------------------------------
await root.unmount();
root = await renderAt('/ai');
check('AI screen still says it is a later phase', text().includes('Phase 4') && text().includes('এখনো তৈরি হয়নি'));

await root.unmount();

const failed = results.filter((result) => !result.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} offline checks passed ===`);
if (failed.length) console.log('Failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
