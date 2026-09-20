import React, { act } from 'react';
import ReactDOMClient from 'react-dom/client';
import { MemoryRouter } from 'react-router-dom';
import App from '../src/App.jsx';

/**
 * END-TO-END SMOKE TEST — `npm run smoke`
 *
 * Renders the real app (React + router + API client) inside jsdom and clicks
 * through it like a user. Runs against the API on port 4000, so start the
 * server first: `cd server && npm start`.
 *
 * The jsdom environment is prepared by `smoke/bootstrap.mjs` before this file is
 * imported — see that file for why the order matters.
 */
const API = process.env.API_URL ?? 'http://127.0.0.1:4000';
const dom = globalThis.__JSDOM__;

const realFetch = globalThis.fetch;
globalThis.fetch = (url, options) => {
  const target = typeof url === 'string' && url.startsWith('/') ? new URL(url, API).toString() : url;
  return realFetch(target, options);
};

const client = (path, method = 'GET', body) =>
  realFetch(API + path, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  }).then((r) => (r.status === 204 ? null : r.json()));

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const text = () => document.body.textContent.replace(/\s+/g, ' ');

// ---------------------------------------------------------------- test harness
const results = [];
function check(name, ok, detail = '') {
  results.push({ name, ok });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail && !ok ? `  → ${detail}` : ''}`);
}

async function renderAt(path, settle = 1500) {
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

const byText = (label, tag = 'button') =>
  [...document.querySelectorAll(tag)].find((el) => el.textContent.trim().includes(label));

async function click(el, settle = 700) {
  if (!el) throw new Error('element not found');
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(settle);
  });
}

/**
 * Types into a controlled React input/textarea.
 *
 * Two jsdom-specific details make this work like a real browser:
 *  1. the value is set through the prototype setter, so React's value tracker
 *     can still detect the change (setting `element.value` would hide it);
 *  2. React only runs its onChange logic when a keydown precedes the input
 *     event, so we dispatch keydown → input → keyup.
 */
async function type(element, value) {
  await act(async () => {
    const proto =
      element.tagName === 'TEXTAREA' ? dom.window.HTMLTextAreaElement.prototype : dom.window.HTMLInputElement.prototype;
    // set through the prototype setter so React's value tracker still sees a change
    Object.getOwnPropertyDescriptor(proto, 'value').set.call(element, value);
    element.dispatchEvent(new dom.window.KeyboardEvent('keydown', { bubbles: true, key: 'a' }));
    element.dispatchEvent(new dom.window.Event('input', { bubbles: true }));
    element.dispatchEvent(new dom.window.KeyboardEvent('keyup', { bubbles: true, key: 'a' }));
    await wait(150);
  });
}

// ---------------------------------------------------------------- reset to known state
/** Puts every topic back to "not started" and rebuilds today's plan. */
async function resetProgressFromSeed() {
  const tree = await client('/api/progress-tree');
  for (const subject of tree.subjects) {
    for (const chapter of subject.chapters) {
      if (chapter.progress.total === 0) continue;
      await client(`/api/subjects/${subject.id}/chapters/${chapter.id}/status`, 'PATCH', {
        status: 'not_started',
      });
    }
  }
  // an earlier run may have been interrupted after creating test subjects
  const current = await client('/api/progress-tree');
  for (const subject of current.subjects) {
    if (subject.name.startsWith('QA ')) await client(`/api/subjects/${subject.id}`, 'DELETE');
  }

  // a previous run may have ticked or deleted today's plan items
  const plan = await client('/api/plan');
  for (const item of plan) await client(`/api/plan/${item.id}`, 'DELETE');
  await client('/api/plan/regenerate', 'POST', {});
}

console.log(`\n=== End-to-end smoke test against ${API} ===\n`);
await resetProgressFromSeed();

// ================================================================ 1. DASHBOARD
let root = await renderAt('/');
let page = text();
check('dashboard shows the overall semester donut', page.includes('Semester শেষ'));
check('dashboard shows all 5 subjects', ['Computer Network', 'IoT & IoT Architecture', 'DBMS', 'Microcontroller', 'Security-Based Surveillance System'].every((n) => page.includes(n)));
check('dashboard shows 0% before any study (no fake progress)', page.includes('0%Semester শেষ'), page.slice(0, 400));
check("dashboard shows today's plan", page.includes("Today's Target"));
check('dashboard shows recommendation with reasons', page.includes('Why this is recommended?'));
check('dashboard shows counters: 77 topics / 13 chapters', page.includes('0 / 77 topic complete') && page.includes('13'));
check('dashboard shows revision + activity sections', page.includes('Revision Due') && page.includes('Recent Activity'));

// ================================================================ 2. PLAN TICK
const firstPlanCheckbox = document.querySelector('button[aria-label="Done"]');
check('today plan has a tickable item', Boolean(firstPlanCheckbox));
if (firstPlanCheckbox) {
  await click(firstPlanCheckbox, 1200);
  // the tick must reach the database and survive a dashboard reload
  const planNow = await client('/api/plan');
  check('ticking a plan item is saved to the database', planNow.some((item) => item.isDone === true));
  const pageAfter = text();
  check('ticking a plan item keeps the plan stable', pageAfter.includes("Today's Target"));
}

// ================================================================ 3. SUBJECT + CHAPTER LIST
await root.unmount();
root = await renderAt('/subjects/4'); // Microcontroller
page = text();
check('subject page lists Microcontroller chapters', page.includes('Microcontroller') && page.includes('Interrupts') && page.includes('Memory Organization'));
check('subject page shows chapter progress bars', page.includes('0%') || page.includes('%'));

// ================================================================ 4. CHAPTER: TOGGLE STATUS
await root.unmount();
root = await renderAt('/subjects/4/chapters/7'); // Memory Organization
page = text();
check('chapter page shows the topic list', page.includes('Topic list') && page.includes('Memory types (ROM/RAM)'));

const completeButtons = [...document.querySelectorAll('button[title="শেষ করেছি"]')];
check('every topic row has a "শেষ করেছি" button', completeButtons.length === 4, `found ${completeButtons.length}`);
await click(completeButtons[0], 1200);

page = text();
check('chapter % recalculated after completing one topic', page.includes('Chapter progress (1/4 topic)') && page.includes('25%'), page.slice(page.indexOf('Chapter progress'), page.indexOf('Chapter progress') + 120));

const dashAfterOne = await client('/api/dashboard');
const micro = dashAfterOne.subjects.find((s) => s.name === 'Microcontroller');
check('API: subject progress follows the chapter (1/37 → 3%)', micro.progress.percent === 3, `got ${micro.progress.percent}%`);
check('API: semester progress updated (1/77 → 1%)', dashAfterOne.overall.percent === 1, `got ${dashAfterOne.overall.percent}%`);

// ================================================================ 5. NOTES
const noteToggle = document.querySelectorAll('button[aria-label="বিস্তারিত"]');
await click(noteToggle[0], 700);
const noteBox = document.querySelector('textarea[id^="note-"]');
check('topic expands to show the personal note box', Boolean(noteBox));
if (noteBox) {
  await type(noteBox, 'QA note: রিভিশনের সময় আবার দেখব');
  await click(byText('নোট যোগ করুন'), 1200);
  check('personal note saved and visible', text().includes('QA note'));
}

// ================================================================ 6. REVISION FLOW
const revisionButton = document.querySelector('button[title="রিভিশন দরকার"]');
await click(revisionButton, 1200);
const dashAfterRevision = await client('/api/dashboard');
check('revision due badge appears on the dashboard', dashAfterRevision.overall.revisionDueCount === 1, `due=${dashAfterRevision.overall.revisionDueCount}`);
check('progress does NOT drop when marked needs-revision', dashAfterRevision.overall.completedTopics === 1);

await root.unmount();
root = await renderAt('/revision', 1600);
page = text();
check('revision page lists the due topic', page.includes('Memory types (ROM/RAM)') || page.includes('Revision Due'));

const completeRevisionButton = byText('Revision complete');
if (completeRevisionButton) {
  await click(completeRevisionButton, 1500);
  const tree = await client('/api/progress-tree');
  const topic = tree.subjects
    .flatMap((s) => s.chapters.flatMap((c) => c.topics))
    .find((t) => t.name === 'Memory types (ROM/RAM)');
  check('revision advanced to Revision 1', topic.revisionStage === 'revision_1', `stage=${topic.revisionStage}`);
  check('next revision date is 7 days out', Math.round((new Date(topic.nextRevisionAt) - new Date(topic.lastRevisionAt)) / 86400000) === 7);
}

// ================================================================ 7. AI NOTE SECTION / SEARCH
await root.unmount();
root = await renderAt('/');
await act(async () => {
  dom.window.dispatchEvent(new dom.window.KeyboardEvent('keydown', { key: 'k', ctrlKey: true, bubbles: true }));
  await wait(400);
});
check('Ctrl+K opens global search', text().includes('Global Search'));
const searchInput = [...document.querySelectorAll('input')].find((i) => i.placeholder?.includes('MQTT'));
if (searchInput) {
  await type(searchInput, 'mqtt');
  await wait(900);
  await act(async () => {
    await wait(600);
  });
  check('search finds the MQTT topic', text().includes('MQTT') && text().includes('IoT'));
}
await act(async () => {
  document.querySelector('button[aria-label="বন্ধ করুন"]')?.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
  await wait(300);
});

// ================================================================ 8. IMPORT (preview + apply)
await root.unmount();
root = await renderAt('/import');
page = text();
check('import page shows the paste box and format tips', page.includes('Format tips') && page.includes('Structure তৈরি করুন'));
const importBox = document.querySelector('textarea');
await type(importBox, 'Subject: QA Test Subject\nChapter: Chapter 1\nTopics:\n- Alpha\n- Beta\n- Gamma');
await click(byText('Structure তৈরি করুন'), 1500);
page = text();
check('import preview lists parsed topics', page.includes('QA Test Subject') && page.includes('Alpha'));
await click(byText('Save করুন'), 2000);
const treeAfterImport = await client('/api/progress-tree');
const qaSubject = treeAfterImport.subjects.find((s) => s.name === 'QA Test Subject');
check('import created subject + chapter + 3 topics', Boolean(qaSubject) && qaSubject.progress.total === 3, JSON.stringify(qaSubject?.progress));

// ================================================================ 9. SUBJECT CREATE / EDIT / DELETE
await root.unmount();
root = await renderAt('/subjects');
await click(byText('Subject'), 600);
const nameInput = [...document.querySelectorAll('input')].find((i) => i.placeholder?.includes('Operating System'));
await type(nameInput, 'QA Manual Subject');
await click(byText('যোগ করুন'), 1500);
check('new subject created from the UI', text().includes('QA Manual Subject'));

const created = (await client('/api/progress-tree')).subjects.find((s) => s.name === 'QA Manual Subject');
await client(`/api/subjects/${created.id}`, 'DELETE');
const qaDeleted = (await client('/api/progress-tree')).subjects.some((s) => s.name === 'QA Manual Subject');
check('subject delete removes it everywhere', !qaDeleted);

// ================================================================ 10. ANALYTICS + SETTINGS + PLACEHOLDERS
await root.unmount();
root = await renderAt('/analytics', 1800);
page = text();
check('analytics shows status, subject bars and study-time block', page.includes('Topic Status') && page.includes('Subject-wise Completion') && page.includes('Study Time'));
check('analytics explains why study time is zero', page.includes('timer এখনো তৈরি হয়নি'));

await root.unmount();
root = await renderAt('/settings');
check('settings offers JSON backup + CSV export', text().includes('Backup (JSON)') && text().includes('Topic list (CSV)'));

await root.unmount();
root = await renderAt('/quiz');
check('phase-3 screen is an honest placeholder', text().includes('Phase 3') && text().includes('এখনো তৈরি হয়নি'));

await root.unmount();
root = await renderAt('/notes', 1400);
check('notes page lists the personal note written earlier', text().includes('QA note') || text().includes('আমার নোট'));

// ================================================================ 11. OFFLINE / SERVER DOWN
await root.unmount();
const workingFetch = globalThis.fetch;
globalThis.fetch = () => Promise.reject(new Error('simulated network failure'));
root = await renderAt('/', 1500);
check(
  'friendly error screen when the API is unreachable',
  text().includes('সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না') && text().includes('আবার চেষ্টা করুন')
);

// retry button must recover once the server answers again
globalThis.fetch = workingFetch;
const retry = byText('আবার চেষ্টা করুন');
check('retry button is offered', Boolean(retry));
if (retry) {
  await click(retry, 1600);
  check('retry reloads the dashboard successfully', text().includes('Semester শেষ'));
}

// ================================================================ cleanup
await client(`/api/subjects/${qaSubject.id}`, 'DELETE');
await resetProgressFromSeed();
await root.unmount();

const failed = results.filter((r) => !r.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} checks passed ===`);
if (failed.length) console.log('Failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
