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
  // Settle OUTSIDE act(): React 19's act() waits for its own async block, and a
  // real network request made inside an effect does not resolve while that await
  // is pending (the in-page sql.js bridge resolves instantly, which is why only
  // the server-mode smoke ever hit this). The trailing act() flushes the state
  // updates those requests produce.
  await wait(settle);
  await act(async () => {
    await wait(60);
  });
  return root;
}

const byText = (label) => [...document.querySelectorAll('button')].find((el) => el.textContent.includes(label));

async function click(element, settle = 900) {
  if (!element) throw new Error('element not found');
  // The event fires inside act(); the waiting happens outside it, because a real
  // network request does not resolve while act() is still awaiting.
  await act(async () => {
    element.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(30);
  });
  await wait(settle);
  await act(async () => {
    await wait(60);
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

// ---- 9. Study Session timer works with no server at all -----------------
await root.unmount();
root = await renderAt('/study', 1800);
page = text();
check('offline study timer opens ready to start', page.includes('পড়া শুরু করো') && page.includes('০ মিনিট'));

await click(byText('পড়া শুরু করো'), 1500);
check('offline timer starts and shows the running clock', text().includes('এখন পড়ছি'));

const running = await api('/sessions/active');
check('the session is stored in the in-page database', running.length === 1 && running[0].endedAt === null);

await api(`/sessions/${running[0].id}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ durationMinutes: 30, confidence: 5, revisionNeeded: true }),
});
await root.unmount();
root = await renderAt('/study', 1800);
check('finished session shows its real 30 minutes offline', text().includes('30 মিনিট') && text().includes('revision দরকার'));

await root.unmount();
root = await renderAt('/analytics', 1800);
check(
  'offline analytics draws the 7-day study chart and most/least studied',
  text().includes('শেষ ৭ দিন') && text().includes('সবচেয়ে বেশি পড়া subject') && text().includes('সবচেয়ে কম পড়া subject')
);

await root.unmount();
root = await renderAt('/study', 1800);

const offlineSummary = await api('/sessions');
check(
  'study time feeds today + streak with no server',
  offlineSummary.summary.todayMinutes === 30 && offlineSummary.summary.currentStreak === 1
);

await globalThis.__OFFLINE_BACKEND__.flush();
await globalThis.__OFFLINE_RELOAD__();
const afterReload = await api('/sessions');
check(
  'the session comes back after a reload of the in-page database',
  afterReload.sessions.length === 1 &&
    afterReload.sessions[0].durationMinutes === 30 &&
    afterReload.summary.todayMinutes === 30
);

// ---- 10. Quiz system with no server at all -------------------------------
await root.unmount();
root = await renderAt('/quiz', 1800);
check('offline quiz screen is honest when empty', text().includes('এখনো কোনো quiz নেই') && text().includes('Average Accuracy'));

const offlineTree = await api('/progress-tree');
const offlineChapter = offlineTree.subjects[0].chapters[0];
const offlineTopic = offlineChapter.topics[0];
const offlineQuiz = await api('/quizzes', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ chapterId: offlineChapter.id, title: 'Offline quiz' }),
});
await api(`/quizzes/${offlineQuiz.id}/questions`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'mcq',
    topicId: offlineTopic.id,
    question: 'offline MCQ?',
    options: ['ঠিক', 'ভুল'],
    correctAnswer: 'ঠিক',
  }),
});

await root.unmount();
root = await renderAt(`/quiz/${offlineQuiz.id}`, 1800);
check('offline quiz editor shows the question and its grading mode', text().includes('offline MCQ?') && text().includes('auto-graded'));

await click(byText('Quiz দাও'), 1500);
const correctRadio = [...document.querySelectorAll('input[type=radio]')].find((el) => el.parentElement.textContent.includes('ঠিক'));
if (correctRadio) {
  await act(async () => {
    correctRadio.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    correctRadio.checked = true;
    correctRadio.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await wait(200);
  });
}
await click(byText('জমা দাও ও স্কোর দেখো'), 2000);
check('offline attempt is graded instantly (1/1, 100%)', text().includes('100%') && text().includes('1/1'), text().slice(0, 300));

const offlineQuizSummary = await api('/quiz-results');
check(
  'offline quiz summary counts the attempt',
  offlineQuizSummary.summary.attempts === 1 && offlineQuizSummary.summary.averageAccuracy === 100
);

await globalThis.__OFFLINE_BACKEND__.flush();
await globalThis.__OFFLINE_RELOAD__();
const afterReloadQuiz = await api('/quiz-results');
check(
  'quiz results survive a reload of the in-page database',
  afterReloadQuiz.summary.attempts === 1 && afterReloadQuiz.results[0].accuracy === 100
);

// ---- 11. Illustration prompt generator works with no server --------------
await root.unmount();
root = await renderAt('/subjects/2/chapters/2', 1900);
check('offline topic rows offer Create Illustration too', text().includes('Create Illustration'));

await click(byText('Create Illustration'), 1200);
check(
  'offline illustration modal is pre-filled from the in-page database',
  text().includes('Create Educational Illustration') && text().includes('IoT'),
  text().slice(-400)
);

await click(byText('Generate Prompt'), 1800);
const offlinePrompt = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check(
  'offline prompt is topic-specific and mentions no AI API key',
  offlinePrompt.includes('AVOID') && offlinePrompt.includes('Diploma-level Computer Science') && !/api key/i.test(offlinePrompt),
  offlinePrompt.slice(0, 200)
);

await click(byText('Regenerate'), 1800);
const offlinePrompt2 = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check('offline Regenerate gives a different prompt', Boolean(offlinePrompt2) && offlinePrompt2 !== offlinePrompt);

await click(byText('Copy Prompt'), 1200);
check(
  'offline Copy Prompt puts the prompt on the clipboard',
  (globalThis.__CLIPBOARD__.at(-1) ?? '').includes('AVOID') && text().includes('Prompt copied successfully!')
);

// ---- 13. Exam Mode works with no server ---------------------------------
await root.unmount();
root = await renderAt('/exam', 2200);
check('offline Exam Mode opens with the setup', text().includes('Exam শুরু করো') && text().includes('প্রশ্ন সংখ্যা'));

const offlineAvailability = await api('/exams/availability?subjectId=4');
check(
  'offline availability finds pattern-based questions for the subject',
  offlineAvailability.generated > 0 && offlineAvailability.scopeLabel.includes('Microcontroller'),
  JSON.stringify(offlineAvailability)
);

await click(byText('Exam শুরু করো'), 2600);
page = text();
check('offline exam runs with a timer and a question map', /\d\d:\d\d/.test(page) && page.includes('প্রশ্ন 1 /'));
check(
  'every exam question says where it came from',
  page.includes('pattern-based প্রশ্ন') || page.includes('নিজের প্রশ্ন ব্যাংক'),
  page.slice(0, 400)
);

await click(byText('Exam জমা দাও'), 900);
await click(byText('হ্যাঁ, জমা দাও'), 2600);
page = text();
check(
  'offline exam grades instantly and shows correct/wrong/unanswered',
  page.includes('Exam Completed') && page.includes('Correct') && page.includes('Unanswered'),
  page.slice(0, 300)
);
const offlineExamStats = await api('/exams/stats');
check('offline exam statistics count the attempt', offlineExamStats.totalExams === 1, JSON.stringify(offlineExamStats.totalExams));

// ---- 14. advanced analytics + PDF report work offline --------------------
await root.unmount();
root = await renderAt('/analytics', 2600);
page = text();
check(
  'offline analytics shows the performance report',
  page.includes('Performance report') && page.includes('Study sessions'),
  page.slice(0, 300)
);
check('offline analytics explains the numbers in words', page.includes('এই data থেকে যা বোঝা যাচ্ছে'));
check('offline analytics offers the PDF export', page.includes('Export Report as PDF'));

await root.unmount();
root = await renderAt('/report', 2600);
page = text();
check(
  'offline PDF report renders every section',
  ['Smart Semester Study Report', 'Overall Progress', 'Exam results', 'Study statistics'].every((heading) => page.includes(heading)),
  page.slice(0, 300)
);
const offlinePrintButton = byText('Export Report as PDF');
const offlinePrintsBefore = globalThis.__PRINT_CALLS__ ?? 0;
if (offlinePrintButton) await click(offlinePrintButton, 400);
check('the PDF button triggers printing offline too', (globalThis.__PRINT_CALLS__ ?? 0) > offlinePrintsBefore);

// ---- 15. auto backup works offline (no server) ---------------------------
await root.unmount();
root = await renderAt('/settings', 2400);
page = text();
check('offline settings shows auto backup', page.includes('Auto Backup') && page.includes('Backup Now'));

const offlineBackupApi = await api('/backups/status');
check('the in-page backend keeps its own backup snapshots', typeof offlineBackupApi.isDue === 'boolean', JSON.stringify(offlineBackupApi).slice(0, 160));

await click(byText('Backup Now'), 2400);
const offlineBackup = await api('/backups');
check(
  'Backup Now stores a snapshot in the in-page database',
  offlineBackup.backups.length >= 1 && offlineBackup.backups[0].sizeBytes > 1000,
  JSON.stringify(offlineBackup.backups[0] ?? {})
);
check('the snapshot status is shown after backing up', /শেষ backup:/.test(text()));

await globalThis.__OFFLINE_BACKEND__.flush();
await globalThis.__OFFLINE_RELOAD__();
const offlineBackupAfterReload = await api('/backups');
check('the snapshot survives a reload of the in-page database', offlineBackupAfterReload.backups.length >= 1);

// ---- 12. study content works with no server and no AI API ----------------
await root.unmount();
root = await renderAt('/subjects/2/chapters/2', 1900);
check('offline topic rows link to Study Content too', text().includes('Study Content'));

const offlineContentLink = [...document.querySelectorAll('a[aria-label*="Study Content"]')][0];
const offlineTopicId = Number((offlineContentLink?.getAttribute('href') ?? '').match(/topicId=(\d+)/)?.[1]);
await click(offlineContentLink, 2000);
check(
  'offline Study Content opens the assistant with the topic pre-selected',
  text().includes('কোনো AI API নেই') && text().includes('Content তৈরি করো'),
  text().slice(0, 300)
);

await click(byText('Content তৈরি করো'), 2400);
const offlineContent = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check(
  'offline content is Bangla, topic-specific and mentions no API key',
  offlineContent.length > 60 && /[\u0980-\u09FF]/.test(offlineContent) && !/api key/i.test(offlineContent),
  offlineContent.slice(0, 120)
);

await click(byText('সব save করো'), 2400);
const offlineSaved = await api(`/study-content/topic/${offlineTopicId}`);
check(
  'offline saving stores the sections as pattern-generated content',
  offlineSaved.length >= 5 && offlineSaved.every((row) => row.model.startsWith('pattern')),
  JSON.stringify(offlineSaved.slice(0, 2))
);

await globalThis.__OFFLINE_BACKEND__.flush();
await globalThis.__OFFLINE_RELOAD__();
const afterReloadContent = await api(`/study-content/topic/${offlineTopicId}`);
check(
  'generated content survives a reload of the in-page database',
  afterReloadContent.length === offlineSaved.length && afterReloadContent.some((row) => row.kind === 'easy_definition')
);

const offlineKinds = await api('/study-content/kinds');
check(
  'offline API also lists the nine sections honestly',
  offlineKinds.kinds.length === 9 && offlineKinds.generator.includes('কোনো AI API নেই')
);

for (const row of afterReloadContent) await fetch(`/api/study-content/${row.id}`, { method: 'DELETE' });

await root.unmount();

const failed = results.filter((result) => !result.ok);
console.log(`\n=== ${results.length - failed.length}/${results.length} offline checks passed ===`);
if (failed.length) console.log('Failed:', failed.map((f) => f.name).join(' | '));
process.exit(failed.length ? 1 : 0);
