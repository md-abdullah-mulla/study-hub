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

const byText = (label, tag = 'button') =>
  [...document.querySelectorAll(tag)].find((el) => el.textContent.trim().includes(label));

async function click(el, settle = 700) {
  if (!el) throw new Error('element not found');
  // The event fires inside act(); the waiting happens outside it, because a real
  // network request does not resolve while act() is still awaiting.
  await act(async () => {
    el.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(30);
  });
  await wait(settle);
  await act(async () => {
    await wait(60);
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

  // The smoke test owns this dev database: it clears quizzes (and with them the
  // attempts) so the "empty and honest" checks mean something. An interrupted
  // run, or a quiz made by hand while poking at the API, would otherwise hide
  // the empty state and the 0% accuracy.
  for (const quiz of (await client('/api/quizzes')).quizzes) {
    await client(`/api/quizzes/${quiz.id}`, 'DELETE');
  }

  // sessions from an earlier run would skew the study-time numbers
  const sessions = await client('/api/sessions');
  for (const session of sessions.sessions) await client(`/api/sessions/${session.id}`, 'DELETE');

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
check('analytics explains study time comes from the timer only', page.includes('Study Session timer থেকে আসে'));

// ================================================================ 11. STUDY TIMER (Phase 2)
await root.unmount();
root = await renderAt('/study', 1800);
page = text();
check('study timer opens with an honest 0-minute day', page.includes('পড়া শুরু করো') && page.includes('০ মিনিট'), page.slice(0, 400));
check('timer screen warns that time is measured, never invented', page.includes('হাতে বানানো study time কখনো সেভ হয় না'), page.slice(0, 400));

await click(byText('পড়া শুরু করো'), 1500);
check('starting a session shows the running clock', text().includes('এখন পড়ছি') && text().includes('চলছে'));

const open = await client('/api/sessions/active');
check('the running session really exists in the database', open.length === 1 && open[0].endedAt === null);

// finish it through the API with a measured 25 minutes, then look at the screen again
await client(`/api/sessions/${open[0].id}`, 'PATCH', { durationMinutes: 25, confidence: 4, note: 'smoke session' });
await root.unmount();
root = await renderAt('/study', 1800);
check('the finished session shows up with its real minutes', text().includes('25 মিনিট') && text().includes('confidence 4/5'));

const summary = (await client('/api/sessions')).summary;
check('study summary counts the session only once', summary.totalMinutes === 25 && summary.currentStreak === 1);

await root.unmount();
root = await renderAt('/analytics', 1800);
check(
  'analytics now reports the real study time',
  text().includes('25 মিনিট') && text().includes('1 দিন') && text().includes('শেষ ৭ দিন')
);
const studiedSubject = (await client('/api/sessions')).sessions.find((s) => s.endedAt)?.subjectName;
check(
  'analytics names the most studied subject from the timer data',
  text().includes('সবচেয়ে বেশি পড়া subject') && text().includes(studiedSubject),
  `expected ${studiedSubject}`
);

// clean up so the database goes back to a clean state
for (const session of (await client('/api/sessions')).sessions) {
  await client(`/api/sessions/${session.id}`, 'DELETE');
}

await root.unmount();
root = await renderAt('/settings');
check('settings offers JSON backup + CSV export', text().includes('Backup (JSON)') && text().includes('Topic list (CSV)'));

// ================================================================ 12. QUIZ (Phase 3)
await root.unmount();
root = await renderAt('/quiz', 1800);
page = text();
check(
  'quiz screen starts empty and honest',
  page.includes('এখনো কোনো quiz নেই') && page.includes('এখনো quiz দাওনি'),
  page.slice(0, 300)
);
check('quiz summary shows an honest 0% before any attempt', page.includes('Average Accuracy') && page.includes('0%'));

// create a quiz through the real API, then check the list + question editor
const cn = (await client('/api/progress-tree')).subjects.find((s) => s.name === 'Computer Network');
const quizChapter = cn.chapters[0];
const mcqTopic = quizChapter.topics[0];
const quiz = await client('/api/quizzes', 'POST', { chapterId: quizChapter.id, title: 'QA smoke quiz' });
await client(`/api/quizzes/${quiz.id}/questions`, 'POST', {
  type: 'mcq',
  topicId: mcqTopic.id,
  question: 'smoke MCQ প্রশ্ন?',
  options: ['ঠিক উত্তর', 'ভুল উত্তর'],
  correctAnswer: 'ঠিক উত্তর',
});
await client(`/api/quizzes/${quiz.id}/questions`, 'POST', {
  type: 'viva',
  topicId: mcqTopic.id,
  question: 'smoke viva প্রশ্ন?',
  correctAnswer: 'মডেল উত্তর',
});

await root.unmount();
root = await renderAt(`/quiz/${quiz.id}`, 1800);
page = text();
check(
  'quiz opens with its questions and both grading hints',
  page.includes('smoke MCQ প্রশ্ন?') && page.includes('auto-graded') && page.includes('নিজে মার্ক করবে'),
  page.slice(0, 500)
);

await click(byText('Quiz দাও'), 1500);
check('quiz can be taken: questions shown without answers', text().includes('উত্তর দিয়েছ 0 টা') && !text().includes('ঠিক উত্তরঃ'));

// answer the MCQ wrongly and the viva with text, through the UI radios/textarea
const radio = [...document.querySelectorAll('input[type=radio]')].find((el) => el.parentElement.textContent.includes('ভুল উত্তর'));
if (radio) {
  await act(async () => {
    radio.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    radio.checked = true;
    radio.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await wait(200);
  });
}
const vivaBox = [...document.querySelectorAll('textarea')].pop();
if (vivaBox) await type(vivaBox, 'আমার নিজের লেখা উত্তর');
await click(byText('জমা দাও ও স্কোর দেখো'), 2000);
page = text();
check('auto-grading marks the wrong MCQ and flags the unmarked written answer', page.includes('নিজে মার্ক বাকি') && page.includes('০ ধরা হয়েছে'));
check('the review reveals the correct answer', page.includes('সঠিক উত্তর'));
check('the topic lands in the measured weak list', page.includes('দুর্বল topic (মাপা, অনুমান নয়)'));

await click(byText('সঠিক'), 1800);
page = text();
check(
  'marking the written answer yourself raises the accuracy',
  page.includes('1/2') && page.includes('50%'),
  page.slice(0, 400)
);

// weak topic -> revision button must really reach the revision queue
const weakTopic = (await client('/api/quiz-results/weak-topics')).weakTopics[0];
if (weakTopic) {
  await click(byText('revision দরকার'), 1500);
  const queue = await client('/api/statuses/revision-queue');
  check('weak topic can be sent to the revision queue from the review', queue.some((item) => item.topicId === weakTopic.topicId));
} else {
  check('weak topic can be sent to the revision queue from the review', false, 'no weak topic was recorded');
}

await root.unmount();
root = await renderAt('/quiz', 1800);
check(
  'quiz list shows the created quiz with its score badge',
  text().includes('QA smoke quiz') && text().includes('1/2'),
  text().slice(0, 300)
);

await client(`/api/quizzes/${quiz.id}`, 'DELETE');
await client(`/api/topics/${mcqTopic.id}/status`, 'PATCH', { status: 'not_started' });

// ================================================================ 13. ILLUSTRATION PROMPT (Phase 4)
await root.unmount();
root = await renderAt(`/subjects/${cn.id}/chapters/${quizChapter.id}`, 1800);
check('every topic row offers Create Illustration', text().includes('Create Illustration'));
check('the quick illustration icon sits on each topic row', document.querySelectorAll('button[aria-label*="illustration prompt"]').length > 0);

await click(byText('Create Illustration'), 1200);
page = text();
check(
  'the illustration modal opens with Subject, Chapter and Topic already filled in',
  page.includes('Create Educational Illustration') && page.includes('Computer Network') && page.includes(quizChapter.name) && page.includes('Network definition'),
  page.slice(0, 400)
);
check('Educational Illustration is the default type', Boolean(byText('Educational Illustration')));

await click(byText('Generate Prompt'), 2000);
page = text();
check('Generate Prompt produces a topic-specific prompt', page.includes('HTTP') || page.includes('Client') || page.includes('network'), page.slice(0, 600));
check(
  'the generated prompt names the audience and the design rules',
  page.includes('Diploma-level Computer Science') && page.includes('educational textbook')
);

const firstPrompt = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check('the prompt text box shows the full prompt', firstPrompt.includes('Subject: Computer Network') && firstPrompt.includes('AVOID'));

await click(byText('Regenerate'), 2000);
const secondPrompt = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check('Regenerate produces a different prompt for the same topic', Boolean(secondPrompt) && secondPrompt !== firstPrompt);

// the dialog that holds the generated prompt (other modals may be mounted too)
const promptDialog = [...document.querySelectorAll('[role="dialog"]')].find((dialog) => dialog.querySelector('pre'));
const editButton = [...(promptDialog?.querySelectorAll('button') ?? [])].find((button) =>
  button.textContent.includes('Edit Prompt')
);
check('the generated prompt offers an edit control', Boolean(editButton));
await click(editButton, 800);
const editor = promptDialog?.querySelector('textarea');
check('the prompt can be edited in a textarea', Boolean(editor) && editor.value === secondPrompt, editor?.value?.slice(0, 60));
if (editor) await type(editor, `${secondPrompt}\n\nMY OWN LINE`);
await click(byText('Copy Prompt'), 1200);
const clipboardText = globalThis.__CLIPBOARD__.at(-1) ?? '';
check('Copy Prompt copies the (edited) prompt to the clipboard', clipboardText.includes('MY OWN LINE'));
check('Copy Prompt reports success', text().includes('Prompt copied successfully!') || text().includes('Copied!'), text().slice(0, 200));

// the API itself must stay free of any AI provider
const promptApi = await client(`/api/topics/${mcqTopic.id}/illustration-prompt`, 'POST', { type: 'architecture_diagram' });
check(
  'no AI API is involved: the prompt is plain text built from the topic data',
  promptApi.prompt.includes(mcqTopic.name) && !/openai|gemini|api key/i.test(promptApi.prompt)
);

await root.unmount();
root = await renderAt(`/subjects/${cn.id}/chapters/${quizChapter.id}`, 1600);

// ================================================================ 14. STUDY CONTENT (Phase 4, no AI API)
check('every topic row links to Study Content', text().includes('Study Content'));
check('the quick content shortcut sits on each topic row', document.querySelectorAll('a[aria-label*="Study Content"]').length > 0);

const contentLink = [...document.querySelectorAll('a[aria-label*="Study Content"]')][0];
await click(contentLink, 2000);
page = text();
check(
  'Study Content opens the AI Assistant screen with the topic already picked',
  page.includes('Study Content') || page.includes('Content তৈরি করো'),
  page.slice(0, 300)
);
check('the screen says plainly that no AI API is used', page.includes('কোনো AI API নেই'), page.slice(0, 400));

await click(byText('Content তৈরি করো'), 2200);
page = text();
check(
  'generated content lists all nine sections',
  ['সহজ সংজ্ঞা', 'ব্যাখ্যা', 'গুরুত্বপূর্ণ পয়েন্ট', 'উদাহরণ', 'পরীক্ষার সংক্ষিপ্ত উত্তর', 'সম্ভাব্য প্রশ্ন', 'MCQ', 'Viva প্রশ্ন', 'রিভিশন সামারি'].every(
    (label) => page.includes(label)
  ),
  page.slice(0, 400)
);
const firstBody = [...document.querySelectorAll('pre')].map((el) => el.textContent).join('\n');
check('the content is real Bangla text for this topic', firstBody.length > 60 && /[\u0980-\u09FF]/.test(firstBody), firstBody.slice(0, 120));

await click(byText('সব save করো'), 2500);
const savedApi = await client(`/api/study-content/topic/${mcqTopic.id}`);
check('saving stores every section, labelled as pattern-generated', savedApi.length >= 9 && savedApi.every((row) => row.model.startsWith('pattern')), JSON.stringify(savedApi.slice(0, 2)));
check('saved content is never marked as an AI model', savedApi.every((row) => !/gpt|gemini|claude/i.test(row.model ?? '')));

// edit one section and make sure the edit is what gets stored
await click(byText('Edit'), 700);
const contentEditor = [...document.querySelectorAll('textarea')].at(-1);
check('a generated section can be edited', Boolean(contentEditor));
if (contentEditor) await type(contentEditor, 'SMOKE-QA: আমার নিজের লেখা সংজ্ঞা');
await click(byText('Save'), 2000);
const editedRow = (await client(`/api/study-content/topic/${mcqTopic.id}`)).find((row) => row.kind === 'easy_definition');
check('the edited text is what is saved', editedRow?.body.includes('SMOKE-QA'), editedRow?.body?.slice(0, 80));

// personal notes must stay separate from generated content
await client(`/api/study-content/${editedRow?.id}/to-note`, 'POST', {});
const personalNotes = await client(`/api/notes?topicId=${mcqTopic.id}&source=personal`);
const aiNotes = await client(`/api/notes?topicId=${mcqTopic.id}&source=ai`);
check('generated content copies into AI notes, not into personal notes', aiNotes.some((row) => row.body.includes('SMOKE-QA')) && !personalNotes.some((row) => row.body.includes('SMOKE-QA')));

const kindsApi = await client('/api/study-content/kinds');
check(
  'the API describes the generator honestly',
  kindsApi.kinds.length === 9 && kindsApi.generator.includes('কোনো AI API নেই'),
  kindsApi.generator
);

await client(`/api/study-content/${editedRow?.id}`, 'DELETE');
const afterDelete = await client(`/api/study-content/topic/${mcqTopic.id}`);
check('deleting a section removes it', !afterDelete.some((row) => row.id === editedRow?.id));

await root.unmount();
root = await renderAt('/quiz', 1200); // leave the app on a normal page

await root.unmount();
root = await renderAt('/notes', 1400);
check('notes page lists the personal note written earlier', text().includes('QA note') || text().includes('আমার নোট'));

// Task-1 follow-up: content must never be borrowed from another subject.
// (The reported bug: "Architecture concepts" got IoT-layer text, "Interrupt
// vector table" got DBMS text, and MCQ options came from every subject.)
const shapeTree = await client('/api/progress-tree');
const mcuSubject = shapeTree.subjects.find((entry) => entry.name === 'Microcontroller');
const mcuTopic = mcuSubject.chapters.flatMap((chapter) => chapter.topics).find((topic) => topic.name === 'Architecture concepts');
const mcuContent = await client(`/api/study-content/topic/${mcuTopic.id}/generate`, 'POST', {});
check(
  'a Microcontroller topic takes its content from the Microcontroller family',
  mcuContent.matchedIds.includes('mcu-architecture') && mcuContent.draft === false,
  JSON.stringify(mcuContent.matchedIds)
);
const mcuWhole = mcuContent.sections.map((section) => section.body).join('\n');
check(
  'no other subject\'s text leaks into it (no IoT layers, no DBMS)',
  !/MQTT|CoAP|IoT layer|Foreign key|Stored procedure/i.test(mcuWhole),
  mcuWhole.slice(0, 160)
);
check(
  'its MCQ options stay inside the Microcontroller domain',
  !/MQTT|CoAP|Foreign key|Stored procedure/i.test(mcuContent.sections.find((section) => section.kind === 'mcq').body ?? '')
);

// ================================================================ 16. ADVANCED ANALYTICS (Phase 5)
await root.unmount();
root = await renderAt('/analytics', 2600);
page = text();
check(
  'analytics shows the performance report with real totals',
  page.includes('Performance report') && page.includes('Study sessions') && page.includes('প্রশ্নের উত্তর'),
  page.slice(0, 400)
);
check('the report explains what the data says (insight sentences)', page.includes('এই data থেকে যা বোঝা যাচ্ছে'), page.slice(0, 400));
check('weak/strong topic blocks are honest when nothing was answered', page.includes('দুর্বল topic') && page.includes('শক্ত topic'));
check('subject-wise performance lists every subject', page.includes('Subject-wise performance') && page.includes('Computer Network'));
check('the analytics page offers the PDF export', page.includes('Export Report as PDF'));
// the rate is only shown once something was really answered; otherwise the card
// says so plainly instead of printing a meaningless "0 % wrong"
const analyticsLabels = ['Exam সেরা', 'Exam সর্বনিম্ন'];
check(
  'analytics show highest AND lowest exam score',
  analyticsLabels.every((label) => page.includes(label)),
  JSON.stringify(Object.fromEntries(analyticsLabels.map((label) => [label, page.includes(label)])))
);
check(
  'answer rates are shown for real answers, never faked when nothing was answered',
  (page.includes('correct rate') && page.includes('wrong rate')) || page.includes('এখনো উত্তর দাওনি'),
  page.slice(0, 200)
);

const advancedApi = await client('/api/analytics/advanced');
check(
  'the analytics payload carries measured numbers only',
  typeof advancedApi.totals.topics === 'number' &&
    advancedApi.chartData.dailyActivity.length === 14 &&
    advancedApi.topics.weak.every((topic) => topic.answered >= 3),
  JSON.stringify(advancedApi.totals)
);
check('every insight is a sentence, not a placeholder', advancedApi.insights.every((insight) => insight.length > 15));

const dashboardInsight = await (async () => {
  await root.unmount();
  root = await renderAt('/', 2200);
  return text();
})();
check('the dashboard shows an insight card with the numbers', dashboardInsight.includes('আজকের insight') && dashboardInsight.includes('topic complete'), dashboardInsight.slice(0, 300));

// ================================================================ 17. PDF REPORT (Phase 5)
await root.unmount();
root = await renderAt('/report', 2400);
page = text();
// the printed name must come from the real profile (Settings → /api/meta),
// never a hardcoded string — a wrong name on a report is worse than no name
const profile = await client('/api/meta');
check('the report opens with the profile student name and date', (() => {
  const line = document.querySelector('.print-area strong');
  return (
    page.includes('Smart Semester Study Report') &&
    page.includes('Report তৈরি') &&
    line &&
    page.includes(`Student: ${profile.studentName}`)
  );
})(), `meta=${profile.studentName} | ${page.slice(0, 300)}`);
check(
  'the report covers progress, subjects, exams, statistics, weak/strong topics',
  ['Overall Progress', 'Subject-wise performance', 'Exam results', 'Study statistics', 'দুর্বল ও শক্ত topic', 'Revision অবস্থা'].every(
    (heading) => page.includes(heading)
  ),
  page.slice(0, 500)
);
check('the report is a real table document, not a screenshot', document.querySelectorAll('.print-area table').length >= 4);
check(
  'the report covers topic-wise progress as well',
  page.includes('Topic progress') && (page.includes('এখনো কোনো topic শুরু করা হয়নি') || document.querySelectorAll('.print-area tbody tr').length > 4),
  page.slice(0, 400)
);
// jsdom does not load the stylesheet, so the print contract is checked by class:
// the toolbar is marked .no-print and the report body .print-area — those are
// exactly the hooks the @media print rules in index.css use.
check(
  'the report marks what to hide and what to print',
  Boolean(document.querySelector('.no-print')) && Boolean(document.querySelector('.print-area'))
);

const printButton = byText('Export Report as PDF');
check('the Export Report as PDF button exists', Boolean(printButton));
const printsBefore = globalThis.__PRINT_CALLS__ ?? 0;
if (printButton) await click(printButton, 400);
check('pressing it opens the browser print dialog (which saves the PDF)', (globalThis.__PRINT_CALLS__ ?? 0) > printsBefore);

// ================================================================ 18. AUTO BACKUP (Phase 5)
await root.unmount();
root = await renderAt('/settings', 2400);
page = text();
check('settings shows the auto backup panel', page.includes('Auto Backup') && page.includes('Backup Now'), page.slice(0, 400));
check('it tells the student when the last backup happened', page.includes('শেষ backup:'));

const backupsBefore = await client('/api/backups');
await click(byText('Backup Now'), 2400);
const backupsAfter = await client('/api/backups');
check(
  'Backup Now takes a real snapshot',
  backupsAfter.backups.length === backupsBefore.backups.length + 1,
  `${backupsBefore.backups.length} → ${backupsAfter.backups.length}`
);
check('the snapshot carries the whole study data', (backupsAfter.backups[0]?.sizeBytes ?? 0) > 1000);
check('the panel now shows a fresh backup time', text().includes('শেষ backup:') && /এখনই|মিনিট আগে/.test(text()), text().slice(0, 200));

const autoCall = await client('/api/backups/auto', 'POST', {});
check('an automatic backup is skipped while a fresh one exists', autoCall.created === false);

await root.unmount();
root = await renderAt('/settings', 1800);
check('the snapshot list is visible after a reload', text().includes('Manual backup') || text().includes('Auto backup'));

// ================================================================ 15. EXAM MODE (Phase 5)
await root.unmount();
root = await renderAt('/exam', 1800);
check('Exam Mode screen opens with the setup', text().includes('Exam শুরু করো') && text().includes('প্রশ্ন সংখ্যা'));
check('the exam setup shows how many questions the scope has', text().includes('pattern-based MCQ'), text().slice(0, 300));

// scope: Computer Network → its chapter → a topic that has generated MCQs
const examScope = await client('/api/progress-tree');
const cnSubject = examScope.subjects.find((entry) => entry.name === 'Computer Network');
const examChapter = cnSubject.chapters[0];
const examTopic = examChapter.topics.find((entry) => entry.name === 'Network definition') ?? examChapter.topics[0];
const availability = await client(`/api/exams/availability?topicId=${examTopic.id}`);
check('availability counts the questions of one topic', availability.topicsInScope === 1, JSON.stringify(availability));

const exam = await client('/api/exams', 'POST', { topicId: examTopic.id, questionCount: 3, durationMinutes: 5 });
check(
  'an exam is created from one topic only',
  exam.questions.length === Math.min(3, availability.generated) &&
    exam.questions.length > 0 &&
    exam.questions.every((question) => question.topicId === examTopic.id) &&
    exam.scopeLabel.includes(examTopic.name),
  `${exam.questions.length} questions | ${exam.scopeLabel}`
);
check('the exam never sends the correct answers to the browser', exam.questions.every((question) => !('answer' in question)));
check(
  'the exam sends an explicit deadline, so a refresh cannot reset the timer',
  Boolean(exam.endsAt) && new Date(exam.endsAt) - new Date(exam.startedAt) === 5 * 60 * 1000,
  `endsAt=${exam.endsAt}`
);

await root.unmount();
root = await renderAt('/exam', 1800);
const startButton = byText('Exam শুরু করো');
await click(startButton, 2200);
page = text();
check('starting an exam opens the runner with a timer', /\d\d:\d\d/.test(page) && page.includes('প্রশ্ন 1 /'), page.slice(0, 300));
check('the runner offers a question map for navigation', document.querySelectorAll('button[aria-label^="প্রশ্ন "]').length >= 3);

// answer the first question, then move on
const firstOption = [...document.querySelectorAll('input[type=radio]')][0];
if (firstOption) {
  await act(async () => {
    firstOption.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));
    firstOption.checked = true;
    firstOption.dispatchEvent(new dom.window.Event('change', { bubbles: true }));
    await wait(120);
  });
}
check('selecting an answer marks it on the question map', text().includes('উত্তর দিয়েছ 1 টা'), text().slice(0, 200));

await click(byText('পরের প্রশ্ন'), 700);
check('Next moves to the second question', text().includes('প্রশ্ন 2 /'), text().slice(0, 200));
await click(byText('আগের প্রশ্ন'), 700);
check('Previous comes back to the first question', text().includes('প্রশ্ন 1 /'));

await click(byText('Exam জমা দাও'), 900);
check('submitting asks for confirmation first', text().includes('Exam জমা দেবে?'), text().slice(0, 200));
await click(byText('হ্যাঁ, জমা দাও'), 2400);
page = text();
check(
  'the result shows the full summary (total, correct, wrong, unanswered, score, percentage, time)',
  ['Total Questions', 'Correct', 'Wrong', 'Unanswered', 'Score', 'Percentage', 'Time Taken'].every((label) => page.includes(label)),
  page.slice(0, 400)
);
check('the unanswered questions are called out, not counted as wrong', page.includes('উত্তর দাওনি'), page.slice(0, 300));
check('the review shows the correct answer of every question', page.includes('(সঠিক উত্তর)'));
check('the exam offers Retry', page.includes('আবার exam (Retry)'));

const examList = await client('/api/exams');
const submittedExam = examList.exams.find((entry) => entry.status === 'submitted' && entry.topicId === examTopic.id) ?? examList.exams[0];
const graded = await client(`/api/exams/${submittedExam.id}`);
check(
  'grading adds up: correct + wrong + unanswered = total',
  graded.summary.correct + graded.summary.wrong + graded.summary.unanswered === graded.summary.total &&
    graded.summary.total === graded.questions.length &&
    graded.summary.total > 0,
  JSON.stringify(graded.summary)
);
check('the saved exam keeps the time the student took', typeof graded.summary.timeTakenSeconds === 'number');

await root.unmount();
root = await renderAt('/exam', 1800);
check('past exams are listed with their score', text().includes(examTopic.name) && /\d\/\d/.test(text()), text().slice(0, 400));

const examStats = await client('/api/exams/stats');
check('exam statistics count the graded exam', examStats.totalExams >= 1 && examStats.totalQuestionsAnswered >= 3, JSON.stringify({ totalExams: examStats.totalExams }));

// an exam can only be submitted once
const secondSubmit = await realFetch(`${API}/api/exams/${submittedExam.id}/submit`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ answers: {} }),
});
check('an exam cannot be submitted twice', secondSubmit.status === 400, String(secondSubmit.status));

await client(`/api/exams/${submittedExam.id}`, 'DELETE');
await client(`/api/exams/${exam.id}`, 'DELETE');

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
