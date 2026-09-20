import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

/**
 * Backend test suite — `npm test`
 *
 * Runs against a throwaway SQLite file in the OS temp folder, so your real
 * study data in data/study.db is never touched.
 */
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'studyhub-test-'));
process.env.DB_FILE = path.join(tmpDir, 'test.db');
process.env.NODE_ENV = 'test';

const { createApp } = await import('../src/app.js');
const { bootstrapDatabase } = await import('../src/db/nodeBootstrap.js');
const { seed } = await import('../src/db/seed.js');

bootstrapDatabase();
seed({ silent: true });

const app = createApp();
const server = app.listen(0);
await new Promise((resolve) => server.once('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}`;

after(() => {
  server.close();
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

async function req(method, url, body) {
  const response = await fetch(base + url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  const isJson = (response.headers.get('content-type') ?? '').includes('application/json');
  return { status: response.status, body: isJson && text ? JSON.parse(text) : null, text };
}

const get = (url) => req('GET', url);
const post = (url, body) => req('POST', url, body);
const patch = (url, body) => req('PATCH', url, body);
const del = (url) => req('DELETE', url);

/** helper: build the tree and find one subject by name */
async function findSubject(name) {
  const tree = await get('/api/progress-tree');
  return tree.body.subjects.find((s) => s.name === name);
}

test('health endpoint answers', async () => {
  const response = await get('/api/health');
  assert.equal(response.status, 200);
  assert.equal(response.body.ok, true);
});

test('seed creates the Semester 6 structure', async () => {
  const tree = await get('/api/progress-tree');
  assert.equal(tree.body.subjects.length, 5);
  const totalTopics = tree.body.subjects.reduce((n, s) => n + s.progress.total, 0);
  const totalChapters = tree.body.subjects.reduce((n, s) => n + s.chapters.length, 0);
  assert.equal(totalChapters, 13);
  assert.equal(totalTopics, 77);
  assert.equal(tree.body.semester.progress.percent, 0, 'nothing may be pre-completed');
});

test('topic status drives chapter, subject and semester percentages', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const chapter = iot.chapters.find((c) => c.number === 1);
  assert.equal(chapter.progress.total, 12);

  for (const topic of chapter.topics.slice(0, 8)) {
    const updated = await patch(`/api/topics/${topic.id}/status`, { status: 'completed' });
    assert.equal(updated.status, 200);
    assert.equal(updated.body.status, 'completed');
  }

  const tree = await get('/api/progress-tree');
  const iotAfter = tree.body.subjects.find((s) => s.name === 'IoT & IoT Architecture');
  assert.equal(iotAfter.progress.completed, 8);
  assert.equal(iotAfter.progress.percent, 67, '8/12 must be 67%');
  assert.equal(iotAfter.chapters[0].progress.percent, 67);
  assert.equal(tree.body.semester.progress.percent, 10, '8/77 must be 10%');
});

test('completing a topic schedules the first revision', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const topic = iot.chapters[0].topics[0];
  assert.equal(topic.revisionStage, 'learned');
  assert.ok(topic.nextRevisionAt, 'next revision date must be set');
  const days = (new Date(topic.nextRevisionAt) - new Date(topic.completedAt)) / 86400000;
  assert.equal(Math.round(days), 3);
});

test('"needs revision" keeps the completed credit and shows in the queue', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const topic = iot.chapters[0].topics[1];

  await patch(`/api/topics/${topic.id}/status`, { status: 'needs_revision' });

  const tree = await get('/api/progress-tree');
  const iotAfter = tree.body.subjects.find((s) => s.name === 'IoT & IoT Architecture');
  assert.equal(iotAfter.progress.percent, 67, 'progress must not drop');
  assert.equal(iotAfter.progress.needsRevision, 1);

  const queue = await get('/api/statuses/revision-queue');
  assert.ok(queue.body.some((item) => item.topicId === topic.id));
});

test('revision complete advances the stage and pushes the next date out', async () => {
  const queue = await get('/api/statuses/revision-queue');
  const item = queue.body[0];

  const done = await post(`/api/topics/${item.topicId}/revision/complete`, {});
  assert.equal(done.status, 200);
  assert.equal(done.body.revisionStage, 'revision_1');
  assert.equal(done.body.revisionCount, 1);

  const days = (new Date(done.body.nextRevisionAt) - new Date(done.body.lastRevisionAt)) / 86400000;
  assert.equal(Math.round(days), 7, 'revision 1 comes 7 days later');
});

test('moving a topic back to studying drops the percentage honestly', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const topic = iot.chapters[0].topics[0];

  await patch(`/api/topics/${topic.id}/status`, { status: 'studying' });

  const tree = await get('/api/progress-tree');
  const iotAfter = tree.body.subjects.find((s) => s.name === 'IoT & IoT Architecture');
  assert.equal(iotAfter.progress.completed, 7);
  assert.equal(iotAfter.progress.percent, 58, '7/12 must be 58%');
});

test('full subject → chapter → topic lifecycle', async () => {
  const created = await post('/api/subjects', { name: 'Operating System', color: '#db2777' });
  assert.equal(created.status, 201);

  const chapter = await post('/api/chapters', { subjectId: created.body.id, name: 'Introduction to OS' });
  assert.equal(chapter.status, 201);
  assert.equal(chapter.body.number, 1, 'chapter number must auto-increment');

  const topic = await post('/api/topics', {
    chapterId: chapter.body.id,
    name: 'OS definition',
    importance: 'high',
  });
  assert.equal(topic.status, 201);

  await patch(`/api/topics/${topic.body.id}/status`, { status: 'completed' });
  const tree = await get('/api/progress-tree');
  const os = tree.body.subjects.find((s) => s.name === 'Operating System');
  assert.equal(os.progress.percent, 100);

  const removed = await del(`/api/subjects/${created.body.id}`);
  assert.equal(removed.status, 204);
  const after = await get('/api/progress-tree');
  assert.equal(after.body.subjects.some((s) => s.name === 'Operating System'), false, 'cascade delete');
});

test('validation and 404 handling', async () => {
  const invalid = await post('/api/subjects', {});
  assert.equal(invalid.status, 400);
  assert.match(invalid.body.error, /Missing required field/);

  const badStatus = await patch('/api/topics/1/status', { status: 'done' });
  assert.equal(badStatus.status, 400);

  const missing = await get('/api/topics/999999');
  assert.equal(missing.status, 404);

  // unknown ids must answer 404 on every PATCH route (they returned 500 once)
  assert.equal((await patch('/api/subjects/999999', { name: 'x' })).status, 404);
  assert.equal((await patch('/api/chapters/999999', { name: 'x' })).status, 404);
  assert.equal((await patch('/api/topics/999999', { name: 'x' })).status, 404);
  assert.equal((await patch('/api/notes/999999', { body: 'x' })).status, 404);
  assert.equal((await patch('/api/plan/999999', { isDone: true })).status, 404);
  assert.equal((await del('/api/subjects/999999')).status, 404);

  const unknownRoute = await get('/api/does-not-exist');
  assert.equal(unknownRoute.status, 404);
});

test('chapter bulk status updates every topic at once', async () => {
  const tree = await get('/api/progress-tree');
  const subject = tree.body.subjects.find((s) => s.name === 'Computer Network');
  const chapter = subject.chapters[0];

  const result = await patch(`/api/subjects/${subject.id}/chapters/${chapter.id}/status`, {
    status: 'completed',
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.updated, chapter.progress.total);

  const after = await findSubject('Computer Network');
  assert.equal(after.progress.percent, 100);

  // put it back so later tests start from a known state
  await patch(`/api/subjects/${subject.id}/chapters/${chapter.id}/status`, { status: 'not_started' });
  const reset = await findSubject('Computer Network');
  assert.equal(reset.progress.percent, 0);
  assert.equal(reset.progress.total, 7);
});

test('notes can be created, edited and deleted, and stay separate from AI notes', async () => {
  const tree = await get('/api/progress-tree');
  const topic = tree.body.subjects[1].chapters[0].topics[0];

  const note = await post('/api/notes', { topicId: topic.id, body: 'MQTT মানে message queue' });
  assert.equal(note.status, 201);
  assert.equal(note.body.source, 'personal');

  const edited = await patch(`/api/notes/${note.body.id}`, { body: 'MQTT = publish/subscribe broker' });
  assert.equal(edited.body.body, 'MQTT = publish/subscribe broker');

  const aiNote = await post('/api/notes', { topicId: topic.id, body: 'AI summary here', source: 'ai' });
  const list = await get(`/api/notes?topicId=${topic.id}`);
  assert.equal(list.body.filter((n) => n.source === 'personal').length, 1);
  assert.equal(list.body.filter((n) => n.source === 'ai').length, 1);

  assert.equal((await del(`/api/notes/${note.body.id}`)).status, 204);
  assert.equal((await del(`/api/notes/${aiNote.body.id}`)).status, 204);
});

test('import parses messy pasted text and skips duplicates', async () => {
  const pasted = [
    'Subject: IoT & IoT Architecture',
    'Chapter: Chapter 5',
    'Topics:',
    '- Sensor types',
    '2. Actuators',
    '• Edge devices',
    '- Sensor types',
  ].join('\n');

  const parsed = await post('/api/import/parse', { text: pasted });
  assert.equal(parsed.body.subjectName, 'IoT & IoT Architecture');
  assert.equal(parsed.body.chapterName, 'Chapter 5');
  assert.deepEqual(parsed.body.topics, ['Sensor types', 'Actuators', 'Edge devices'], 'duplicates removed');

  const subject = await findSubject('IoT & IoT Architecture');
  const applied = await post('/api/import/apply', {
    subjectId: subject.id,
    chapterName: parsed.body.chapterName,
    chapterNumber: 5,
    topics: parsed.body.topics,
  });
  assert.equal(applied.body.createdCount, 3);
  assert.equal(applied.body.chapterCreated, true);

  // running it twice must not duplicate anything
  const again = await post('/api/import/apply', {
    subjectId: subject.id,
    chapterId: applied.body.chapter.id,
    topics: parsed.body.topics,
  });
  assert.equal(again.body.createdCount, 0);
  assert.equal(again.body.skippedCount, 3);

  const empty = await post('/api/import/parse', { text: '   ' });
  assert.equal(empty.status, 400);
});

test('global search finds topics, chapters and notes', async () => {
  const topics = await get('/api/search?q=mqtt');
  assert.equal(topics.body.topics[0].name, 'MQTT');
  assert.equal(topics.body.topics[0].subjectName, 'IoT & IoT Architecture');

  const subjects = await get('/api/search?q=Microcontroller');
  assert.ok(subjects.body.subjects.length >= 1);

  const empty = await get('/api/search?q=');
  assert.equal(empty.body.total, 0);
});

test("today's plan is generated once and stays editable", async () => {
  const dashboard = await get('/api/dashboard');
  const plan = dashboard.body.todayPlan;
  assert.ok(plan.length >= 1 && plan.length <= 3, 'plan keeps at most 3 items');
  assert.ok(plan[0].title.length > 0);

  // remove one item — the dashboard must not resurrect it during the day
  await del(`/api/plan/${plan[0].id}`);
  const after = await get('/api/dashboard');
  assert.equal(after.body.todayPlan.length, plan.length - 1);

  // explicit regenerate rebuilds it
  const regenerated = await post('/api/plan/regenerate', {});
  assert.ok(regenerated.body.length >= 1);
  assert.ok(regenerated.body.length <= 3);
});

test('plan items can be ticked, renamed and un-ticked', async () => {
  const plan = await post('/api/plan/regenerate', {});
  const item = plan.body[0];
  assert.equal(item.isDone, false);

  // tick it — this used to answer twice (ERR_HTTP_HEADERS_SENT)
  const ticked = await patch(`/api/plan/${item.id}`, { isDone: true });
  assert.equal(ticked.status, 200);
  assert.equal(ticked.body.isDone, true);

  const stored = await get('/api/plan');
  assert.equal(stored.body.find((p) => p.id === item.id).isDone, true, 'tick must be persisted');

  const renamed = await patch(`/api/plan/${item.id}`, { title: 'আজ MQTT রিভিশন' });
  assert.equal(renamed.body.title, 'আজ MQTT রিভিশন');
  assert.equal(renamed.body.isDone, true, 'renaming must not clear the tick');

  const unticked = await patch(`/api/plan/${item.id}`, { isDone: false });
  assert.equal(unticked.body.isDone, false);

  const missing = await patch('/api/plan/999999', { isDone: true });
  assert.equal(missing.status, 404);
});

test('partial updates only touch the fields that were sent', async () => {
  const tree = await get('/api/progress-tree');
  const topic = tree.body.subjects[0].chapters[0].topics[0];

  // send ONE field: name, importance and status must stay untouched
  const updated = await patch(`/api/topics/${topic.id}`, { description: 'শুধু description বদলেছে' });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.description, 'শুধু description বদলেছে');
  assert.equal(updated.body.name, topic.name, 'name must not be blanked out');
  assert.equal(updated.body.importance, topic.importance);
  assert.equal(updated.body.status, topic.status);

  const chapter = await patch(`/api/chapters/${topic.chapterId}`, { notes: 'chapter note only' });
  assert.equal(chapter.body.notes, 'chapter note only');
  assert.equal(chapter.body.name, tree.body.subjects[0].chapters[0].name);

  const subject = await patch(`/api/subjects/${tree.body.subjects[0].id}`, { code: '28561' });
  assert.equal(subject.body.code, '28561');
  assert.equal(subject.body.name, tree.body.subjects[0].name);
  assert.equal(subject.body.color, tree.body.subjects[0].color);
});

test('exports work: JSON backup and CSV of all topics', async () => {
  const backup = await get('/api/export/backup');
  assert.equal(backup.status, 200);
  for (const key of ['subjects', 'semester', 'notes', 'studyPlan', 'aiContents', 'generatedImages']) {
    assert.ok(key in backup.body, `backup must include ${key}`);
  }

  const csv = await get('/api/export/topics.csv');
  const lines = csv.text.trim().split('\n');
  assert.match(lines[0], /^subject,chapter_number,chapter_name,topic/);
  const tree = await get('/api/progress-tree');
  const topicCount = tree.body.subjects.reduce((n, s) => n + s.progress.total, 0);
  assert.equal(lines.length, topicCount + 1, 'one CSV row per topic plus the header');
});

test('dashboard recommendation explains itself with real reasons', async () => {
  const dashboard = await get('/api/dashboard');
  const rec = dashboard.body.recommendation;
  assert.ok(rec, 'a recommendation must exist while subjects are unfinished');
  assert.ok(rec.reasons.length >= 2);
  assert.ok(rec.reasons.some((r) => r.label.includes('completion')));
  assert.ok(rec.subjectId && rec.chapterId);
  assert.ok(typeof rec.score === 'number');
});
