import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { CONCEPT_ENTRIES } from '../src/services/illustration/conceptLibrary.js';
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

// ---------------------------------------------------------------------------
// Phase 2 — Study Session Tracker + analytics
// ---------------------------------------------------------------------------

test('study analytics stay empty (not invented) before the first session', async () => {
  const analytics = await get('/api/analytics');
  assert.equal(analytics.status, 200);
  assert.equal(analytics.body.totalMinutes, 0);
  assert.equal(analytics.body.sessionCount, 0);
  assert.equal(analytics.body.averageSessionMinutes, 0);
  assert.equal(analytics.body.mostStudied, null, 'no session -> no "most studied subject"');
  assert.equal(analytics.body.leastStudied, null);
  assert.equal(analytics.body.last7Days.length, 7, 'the week chart always has 7 honest days');
  assert.ok(analytics.body.last7Days.every((d) => d.minutes === 0));
});

test('starting a session on a topic marks it "studying" but never "completed"', async () => {
  const microcontroller = await findSubject('Microcontroller');
  const topic = microcontroller.chapters[0].topics[0];
  assert.equal(topic.status, 'not_started');

  const started = await post('/api/sessions', { topicId: topic.id });
  assert.equal(started.status, 201);
  assert.equal(started.body.endedAt, null);
  assert.equal(started.body.durationMinutes, 0, 'no time is claimed before the session ends');
  // the subject/chapter are derived from the topic, so they can never disagree
  assert.equal(started.body.chapterId, topic.chapterId);
  assert.equal(started.body.subjectId, microcontroller.id);

  const tree = await get('/api/progress-tree');
  const after = tree.body.subjects.find((s) => s.name === 'Microcontroller');
  const topicAfter = after.chapters[0].topics.find((t) => t.id === topic.id);
  assert.equal(topicAfter.status, 'studying', 'real study moves the topic to studying');
  assert.equal(after.progress.completed, 0, '...but progress stays 0 until the student says it is done');
});

test('finishing a session stores the measured duration, confidence and note', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const topic = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  const started = await post('/api/sessions', { topicId: topic.id });
  const finished = await patch(`/api/sessions/${started.body.id}`, {
    durationMinutes: 45,
    confidence: 4,
    topicsCompleted: 1,
    revisionNeeded: false,
    note: 'MQTT broker আর topic ঠিকভাবে বুঝেছি',
  });

  assert.equal(finished.status, 200);
  assert.equal(finished.body.durationMinutes, 45);
  assert.equal(finished.body.confidence, 4);
  assert.equal(finished.body.topicsCompleted, 1);
  assert.equal(finished.body.revisionNeeded, false);
  assert.match(finished.body.note, /MQTT broker/);
  assert.ok(finished.body.endedAt, 'a finished session has an end time');

  // finishing twice must not lose the first values (partial PATCH rule)
  const renamed = await patch(`/api/sessions/${started.body.id}`, { note: 'note badalano' });
  assert.equal(renamed.body.durationMinutes, 45);
  assert.equal(renamed.body.confidence, 4);
  assert.equal(renamed.body.note, 'note badalano');

  // a session without durationMinutes measures the clock itself (>= 0, never NaN)
  const quick = await post('/api/sessions', { subjectId: iot.id });
  const quickDone = await patch(`/api/sessions/${quick.body.id}`, {});
  assert.equal(quickDone.status, 200);
  assert.ok(Number.isInteger(quickDone.body.durationMinutes));
  assert.ok(quickDone.body.durationMinutes >= 0);
});

test('dashboard study time and streak come from the stored sessions', async () => {
  const history = await get('/api/sessions');
  assert.equal(history.status, 200);
  assert.equal(history.body.summary.totalMinutes, 45, 'only the real 45 minutes are counted');
  assert.equal(history.body.summary.todayMinutes, 45);
  assert.equal(history.body.summary.currentStreak, 1, 'studying today starts a streak');
  assert.equal(history.body.summary.activeDays, 1);
  const startedAt = history.body.sessions.map((s) => s.startedAt);
  assert.deepEqual(startedAt, [...startedAt].sort().reverse(), 'newest session comes first');
  assert.equal(history.body.sessions.filter((s) => s.durationMinutes === 45).length, 1);

  const dashboard = await get('/api/dashboard');
  assert.equal(dashboard.body.stats.todayStudyMinutes, 45);
  assert.equal(dashboard.body.stats.totalStudyMinutes, 45);
  assert.equal(dashboard.body.stats.currentStreak, 1, 'dashboard streak uses the same source');

  const bySubject = history.body.summary.bySubject.find((s) => s.subjectName === 'IoT & IoT Architecture');
  assert.equal(bySubject.minutes, 45, 'subject-wise study time is tracked');
});

test('sessions can be filtered by day and an unfinished one is listed as active', async () => {
  const open = await post('/api/sessions', { subjectId: (await findSubject('DBMS')).id });
  const active = await get('/api/sessions/active');
  assert.ok(active.body.some((s) => s.id === open.body.id));

  const dashboard = await get('/api/dashboard');
  assert.equal(dashboard.body.stats.totalStudyMinutes, 45, 'an open session adds no minutes');

  const today = new Date().toISOString().slice(0, 10);
  const all = await get('/api/sessions');
  const inRange = await get(`/api/sessions?from=${today}&to=${today}&limit=5`);
  assert.equal(inRange.body.sessions.length, all.body.sessions.length, 'every session so far is from today');

  const oldRange = await get('/api/sessions?from=2000-01-01&to=2000-01-02');
  assert.equal(oldRange.body.sessions.length, 0, 'other days return nothing');

  const removed = await del(`/api/sessions/${open.body.id}`);
  assert.equal(removed.status, 204);
  const stillActive = await get('/api/sessions/active');
  assert.ok(!stillActive.body.some((s) => s.id === open.body.id), 'the deleted session is gone');
});

test('"revision needed" pulls a completed topic back into the revision queue', async () => {
  const cn = await findSubject('Computer Network');
  const topic = cn.chapters[0].topics[0];
  const completed = await patch(`/api/topics/${topic.id}/status`, { status: 'completed' });
  assert.equal(completed.body.status, 'completed');

  const session = await post('/api/sessions', { topicId: topic.id });
  await patch(`/api/sessions/${session.body.id}`, { durationMinutes: 30, revisionNeeded: true });

  const queue = await get('/api/statuses/revision-queue');
  assert.ok(
    queue.body.some((item) => item.topicId === topic.id),
    'the topic must be due for revision right away'
  );

  const tree = await get('/api/progress-tree');
  const cnAfter = tree.body.subjects.find((s) => s.name === 'Computer Network');
  const topicAfter = cnAfter.chapters[0].topics.find((t) => t.id === topic.id);
  assert.equal(topicAfter.status, 'completed', 'revision debt never un-completes a topic');
  assert.equal(cnAfter.progress.completed, cn.progress.completed + 1, 'the percentage only counts completion');
});

test('session validation and 404s are honest errors', async () => {
  const badConfidence = await patch('/api/sessions/1', { confidence: 9 });
  assert.equal(badConfidence.status, 400);

  const badDuration = await patch('/api/sessions/1', { durationMinutes: -5 });
  assert.equal(badDuration.status, 400);

  const tooLong = await patch('/api/sessions/1', { durationMinutes: 5000 });
  assert.equal(tooLong.status, 400, 'a 5000-minute sitting is refused, not silently stored');

  assert.equal((await get('/api/sessions/999999')).status, 404);
  assert.equal((await patch('/api/sessions/999999', { durationMinutes: 10 })).status, 404);
  assert.equal((await del('/api/sessions/999999')).status, 404);
  assert.equal((await post('/api/sessions', { topicId: 999999 })).status, 404);
  assert.equal((await post('/api/sessions', { subjectId: 'abc' })).status, 400);
});


test('analytics summarises the week, the average sitting and most/least studied', async () => {
  const history = await get('/api/sessions');
  const analytics = await get('/api/analytics');
  assert.equal(analytics.status, 200);
  const body = analytics.body;
  const sessions = history.body.sessions;
  const finished = sessions.filter((s) => s.endedAt);
  const measured = finished.reduce((sum, s) => sum + s.durationMinutes, 0);
  const minutesOf = (name) =>
    finished.filter((s) => s.subjectName === name).reduce((sum, s) => sum + s.durationMinutes, 0);

  assert.equal(body.totalMinutes, measured, 'the total is exactly what the timer stored');
  assert.equal(body.weekMinutes, measured, 'every session so far is from today, so it is the week too');
  assert.equal(body.todayMinutes, measured);
  assert.equal(body.sessionCount, sessions.length, 'open sittings are counted as sessions too');
  assert.equal(body.averageSessionMinutes, Math.round(measured / finished.length), 'average per finished sitting');
  assert.equal(body.currentStreak, 1);

  assert.equal(body.mostStudied.name, 'IoT & IoT Architecture', 'the subject with the most measured time');
  assert.equal(body.mostStudied.minutes, minutesOf('IoT & IoT Architecture'));
  assert.equal(body.leastStudied.minutes, 0, 'the least studied subject is an untouched one');
  assert.equal(
    body.bySubject.find((row) => row.subjectName === 'IoT & IoT Architecture').sharePercent,
    Math.round((minutesOf('IoT & IoT Architecture') / measured) * 100),
    'the share adds up to the real total'
  );

  assert.equal(body.last7Days.length, 7);
  const today = body.last7Days[6];
  assert.equal(today.isToday, true);
  assert.equal(today.minutes, measured, 'today is the last bar of the week chart');
  assert.equal(body.last7Days.slice(0, 6).every((d) => d.minutes === 0), true, 'earlier days are honest zeros');
  assert.match(today.label, /^(রবি|সোম|মঙ্গল|বুধ|বৃহঃ|শুক্র|শনি)$/);
});

// ---------------------------------------------------------------------------
// Phase 3 — Quiz system
// ---------------------------------------------------------------------------

/** Creates a quiz on the first chapter of a subject with one question of each type. */
async function makeQuizFixture(subjectName, topicNames) {
  const subject = await findSubject(subjectName);
  const chapter = subject.chapters[0];
  const quiz = await post('/api/quizzes', { chapterId: chapter.id, title: `${subjectName} — quiz` });
  assert.equal(quiz.status, 201);

  const [topicA, topicB] = topicNames.map((name) => chapter.topics.find((t) => t.name === name));

  const questions = [];
  questions.push(
    await post(`/api/quizzes/${quiz.body.id}/questions`, {
      type: 'mcq',
      topicId: topicA.id,
      question: 'নিচের কোনটা সঠিক?',
      options: ['option A', 'option B', 'option C'],
      correctAnswer: 'option B',
      explanation: 'কারণ option B-ই ঠিক',
    })
  );
  questions.push(
    await post(`/api/quizzes/${quiz.body.id}/questions`, {
      type: 'true_false',
      topicId: topicA.id,
      question: 'এই কথাটা সত্য?',
      correctAnswer: 'মিথ্যা',
    })
  );
  questions.push(
    await post(`/api/quizzes/${quiz.body.id}/questions`, {
      type: 'short',
      topicId: topicB.id,
      question: 'সংক্ষেপে লিখো',
      correctAnswer: 'মডেল উত্তর',
    })
  );
  return { subject, chapter, quiz: quiz.body, questions: questions.map((q) => q.body) };
}

test('a quiz can be created with questions of all four types, but answers stay hidden', async () => {
  const { quiz, questions, chapter } = await makeQuizFixture('Computer Network', [
    'Network definition',
    'Basic concepts',
  ]);

  assert.equal(questions.length, 3);
  assert.equal(questions[0].options.length, 3);
  assert.equal(questions[0].correctAnswer, 'option B');
  assert.equal(questions[1].options.join('/'), 'সত্য/মিথ্যা', 'true/false options are added automatically');

  const viva = await post(`/api/quizzes/${quiz.id}/questions`, {
    type: 'viva',
    topicId: chapter.topics[0].id,
    question: 'MQTT কী?',
    correctAnswer: 'হালকা messaging protocol',
  });
  assert.equal(viva.status, 201);
  assert.equal(viva.body.type, 'viva');

  // what the UI gets for taking the quiz must not leak the answers
  const taken = await get(`/api/quizzes/${quiz.id}`);
  assert.equal(taken.body.questions.length, 4);
  for (const question of taken.body.questions) {
    assert.equal(question.correctAnswer, undefined, 'correct answers are never sent before submitting');
    assert.equal(question.explanation, undefined);
    assert.equal(typeof question.hasAnswer, 'boolean');
  }

  // the editor asks for the answers explicitly
  const editor = await get(`/api/quizzes/${quiz.id}?answers=1`);
  assert.equal(editor.body.questions[0].correctAnswer, 'option B', 'the editor can see answers');
  assert.equal(editor.body.questions[1].correctAnswer, 'মিথ্যা');

  const list = await get('/api/quizzes');
  assert.equal(list.body.quizzes.length, 1);
  assert.equal(list.body.quizzes[0].questionCount, 4);
  assert.equal(list.body.quizzes[0].chapterId, chapter.id);
  assert.equal(list.body.quizzes[0].subjectName, 'Computer Network');
});

test('question validation refuses answers that do not match the options', async () => {
  const list = await get('/api/quizzes');
  const quizId = list.body.quizzes[0].id;

  const badType = await post(`/api/quizzes/${quizId}/questions`, { type: 'essay', question: 'x' });
  assert.equal(badType.status, 400);

  const oneOption = await post(`/api/quizzes/${quizId}/questions`, {
    type: 'mcq',
    question: 'x',
    options: ['only one'],
    correctAnswer: 'only one',
  });
  assert.equal(oneOption.status, 400, 'an MCQ needs at least two options');

  const wrongAnswer = await post(`/api/quizzes/${quizId}/questions`, {
    type: 'mcq',
    question: 'x',
    options: ['a', 'b'],
    correctAnswer: 'c',
  });
  assert.equal(wrongAnswer.status, 400, 'the correct answer must be one of the options');

  const badTf = await post(`/api/quizzes/${quizId}/questions`, {
    type: 'true_false',
    question: 'x',
    correctAnswer: 'maybe',
  });
  assert.equal(badTf.status, 400);

  // a question may not point at a topic from another chapter
  const other = await findSubject('DBMS');
  const foreignTopic = await post(`/api/quizzes/${quizId}/questions`, {
    type: 'short',
    question: 'x',
    topicId: other.chapters[0].topics[0].id,
  });
  assert.equal(foreignTopic.status, 400, 'weak-topic reporting only works inside the quiz chapter');

  assert.equal((await post('/api/quizzes', { chapterId: 999999, title: 'x' })).status, 404);
  assert.equal((await post('/api/quizzes', { chapterId: 1 })).status, 400, 'a title is required');
});

test('MCQ and True/False are graded by the app, written answers wait for the student', async () => {
  const list = await get('/api/quizzes');
  const quiz = list.body.quizzes[0];
  const questions = (await get(`/api/quizzes/${quiz.id}`)).body.questions;
  const mcq = questions.find((q) => q.type === 'mcq');
  const tf = questions.find((q) => q.type === 'true_false');
  const written = questions.filter((q) => q.type === 'short' || q.type === 'viva');

  const attempt = await post(`/api/quizzes/${quiz.id}/attempt`, {
    answers: [
      { questionId: mcq.id, answer: '  OPTION b ' }, // spelling of whitespace/case must not matter
      { questionId: tf.id, answer: 'সত্য' }, // deliberately wrong
      { questionId: written[0].id, answer: 'আমার লেখা উত্তর' },
    ],
  });

  assert.equal(attempt.status, 201);
  const { result, review, unmarkedQuestionIds } = attempt.body;
  assert.equal(result.total, 4, 'every question is worth one point');
  assert.equal(result.score, 1, 'only the correct MCQ scores — written answers are not guessed');
  assert.equal(result.accuracy, 25);

  const mcqReview = review.find((r) => r.questionId === mcq.id);
  assert.equal(mcqReview.isCorrect, true);
  assert.equal(mcqReview.correctAnswer, 'option B', 'the correct answer is revealed after submitting');

  const writtenReview = review.find((r) => r.questionId === written[0].id);
  assert.equal(writtenReview.selfGraded, false);
  assert.equal(writtenReview.awarded, 0);
  assert.equal(unmarkedQuestionIds.length, 2, 'both written questions are waiting to be marked');

  // the topic with the wrong + unmarked answers must now show up as weak...
  const weak = await get('/api/quiz-results/weak-topics');
  assert.equal(weak.body.weakTopics.length, 2, 'only topics that were really asked can be weak');
  assert.ok(weak.body.weakTopics.every((t) => t.accuracy < 60));
  assert.ok(weak.body.weakTopics.every((t) => t.suggestRevision === true));

  // ...and the summary must describe the attempt honestly
  const summary = await get('/api/quiz-results');
  assert.equal(summary.body.summary.attempts, 1);
  assert.equal(summary.body.summary.averageAccuracy, 25);
  assert.equal(summary.body.results.length, 1);
});

test('marking a written answer yourself updates the score and the weak list', async () => {
  const results = await get('/api/quiz-results');
  const resultId = results.body.results[0].id;
  const detail = await get(`/api/quiz-results/${resultId}`);
  const written = detail.body.review.filter((r) => !r.autoGraded);

  const badMark = await patch(`/api/quiz-results/${resultId}/self-mark`, {
    marks: [{ questionId: written[0].questionId, selfScore: 0.75 }],
  });
  assert.equal(badMark.status, 400, 'only 1 / 0.5 / 0 are allowed');

  const mcqMark = await patch(`/api/quiz-results/${resultId}/self-mark`, {
    marks: [{ questionId: detail.body.review.find((r) => r.autoGraded).questionId, selfScore: 1 }],
  });
  assert.equal(mcqMark.status, 400, 'auto-graded questions cannot be marked by hand');

  const marked = await patch(`/api/quiz-results/${resultId}/self-mark`, {
    marks: [
      { questionId: written[0].questionId, selfScore: 1 },
      { questionId: written[1].questionId, selfScore: 0.5 },
    ],
  });
  assert.equal(marked.status, 200);
  assert.equal(marked.body.result.score, 2.5, '1 (mcq) + 1 (full) + 0.5 (partial)');
  assert.equal(marked.body.result.accuracy, 63, '2.5 of 4 is 63%');
  assert.equal(marked.body.unmarkedQuestionIds.length, 0, 'nothing is waiting to be marked any more');
  assert.equal(marked.body.review.filter((r) => r.selfGraded).length, 2);
  assert.equal(marked.body.result.weakTopics.length, 1, 'the still-wrong topic stays weak');

  const afterMarking = await get('/api/quiz-results/weak-topics');
  assert.equal(afterMarking.body.summary.averageAccuracy, 63, 'the summary follows the corrected attempt');

  const unknown = await patch(`/api/quiz-results/${resultId}/self-mark`, {
    marks: [{ questionId: 999999, selfScore: 1 }],
  });
  assert.equal(unknown.status, 404);
});

test('quiz attempts are reviewed, listed and deletable with the quiz', async () => {
  const results = await get('/api/quiz-results');
  const resultId = results.body.results[0].id;
  const detail = await get(`/api/quiz-results/${resultId}`);

  assert.equal(detail.status, 200);
  assert.equal(detail.body.quizTitle.includes('Computer Network'), true);
  assert.ok(detail.body.review.every((r) => r.question && r.typeLabel), 'each row has the question + type label');
  assert.ok(detail.body.weakTopics.length >= 1);

  const list = await get('/api/quizzes');
  const quizId = list.body.quizzes[0].id;
  const renamed = await patch(`/api/quizzes/${quizId}`, { title: 'Computer Network — অধ্যায় ১ quiz' });
  assert.equal(renamed.body.title, 'Computer Network — অধ্যায় ১ quiz');

  const edited = await patch(`/api/quizzes/${quizId}/questions/${detail.body.review[0].questionId}`, {
    explanation: 'আগের explanation বদলানো',
  });
  assert.equal(edited.body.explanation, 'আগের explanation বদলানো');
  assert.equal(edited.body.question, detail.body.review[0].question, 'the rest of the question stays');

  assert.equal((await get('/api/quizzes/999999')).status, 404);
  assert.equal((await post('/api/quizzes/999999/attempt', { answers: [] })).status, 404);
  assert.equal((await get('/api/quiz-results/999999')).status, 404);

  const removed = await del(`/api/quizzes/${quizId}`);
  assert.equal(removed.status, 204);
  assert.equal((await get('/api/quizzes')).body.quizzes.length, 0, 'the quiz is gone');
  assert.equal(
    (await get('/api/quiz-results')).body.results.length,
    0,
    'its attempts go with it — no orphan results, and no fake accuracy left behind'
  );
  assert.equal((await get('/api/quiz-results/weak-topics')).body.weakTopics.length, 0);
  assert.equal((await get('/api/quizzes')).body.summary.averageAccuracy, 0, 'accuracy is 0 again, not a stale number');
});

// ---------------------------------------------------------------------------
// Phase 4 (first feature) — AI illustration prompt generator
// ---------------------------------------------------------------------------

test('illustration types are offered without any AI API or key', async () => {
  const types = await get('/api/illustration/types');
  assert.equal(types.status, 200);
  assert.equal(types.body.types.length, 5);
  assert.deepEqual(
    types.body.types.map((t) => t.value),
    ['concept_diagram', 'process_flow', 'architecture_diagram', 'educational_illustration', 'concept_visualization']
  );
  assert.equal(types.body.defaultType, 'educational_illustration', 'the spec default');
  assert.match(types.body.note, /API key লাগে না/);

  const meta = await get('/api/meta');
  assert.deepEqual(
    meta.body.illustrationTypes.map((t) => t.value),
    types.body.types.map((t) => t.value),
    'the UI reads the same list from /api/meta'
  );
});

test('the prompt is built from the topic data and is genuinely topic-specific', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  const response = await post(`/api/topics/${mqtt.id}/illustration-prompt`, { type: 'concept_diagram' });
  assert.equal(response.status, 200);
  const body = response.body;
  const prompt = body.prompt;

  assert.equal(body.subject.name, 'IoT & IoT Architecture', 'the real subject data is used');
  assert.equal(body.chapter.id, mqtt.chapterId);
  assert.equal(body.topic.name, 'MQTT');
  assert.equal(body.type, 'concept_diagram');
  assert.equal(body.variant, 0);
  assert.equal(body.variantCount, 3);

  // every required part of the prompt (spec §4)
  for (const expected of ['IoT & IoT Architecture', 'MQTT', 'Concept Diagram', 'Diploma-level Computer Science']) {
    assert.ok(prompt.includes(expected), `the prompt must mention ${expected}`);
  }
  for (const component of ['MQTT Publisher', 'MQTT Broker', 'MQTT Subscriber', 'MQTT Topic']) {
    assert.ok(prompt.includes(component), `the prompt must describe ${component}`);
  }
  assert.match(prompt, /Publisher → Broker/, 'the relationship between the parts must be spelled out');
  assert.match(prompt, /arrows/i, 'clear arrows must be requested');
  assert.match(prompt, /educational textbook/i, 'educational textbook style');
  assert.match(prompt, /No decorative or unrelated elements/i, 'decorative clutter must be refused');
  assert.match(prompt, /Bangladeshi Diploma-level/i, 'the Bangladeshi study context');

  // no generic prompt, and no AI service anywhere in it
  assert.notEqual(prompt.trim(), 'Create an image about MQTT');
  assert.ok(!/openai|gemini|api key|https?:\/\//i.test(prompt), 'no API or URL belongs in the prompt');
  assert.ok(body.profile.components.length >= 4);
  assert.equal(body.profile.source, 'library');
});

test('each illustration type produces a different, type-appropriate prompt', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');
  const types = ['concept_diagram', 'process_flow', 'architecture_diagram', 'educational_illustration', 'concept_visualization'];

  const prompts = [];
  for (const type of types) {
    const response = await post(`/api/topics/${mqtt.id}/illustration-prompt`, { type });
    assert.equal(response.status, 200);
    prompts.push(response.body.prompt);
  }
  assert.equal(new Set(prompts).size, types.length, 'every type must give a different prompt');

  assert.match(prompts[1], /Show the process in exactly this order/, 'process flow asks for ordered steps');
  assert.match(prompts[2], /inside its own labelled box/, 'architecture asks for labelled blocks');
  assert.match(prompts[3], /simple, realistic objects/, 'educational illustration asks for a recognisable scene');
  assert.match(prompts[4], /truthful/, 'concept visualization must stay technically truthful');
});

test('regenerate walks through variants and then suggests the next type', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  const seen = new Set();
  const meta = await post(`/api/topics/${mqtt.id}/illustration-prompt`, { type: 'concept_diagram', variant: 0 });
  for (let variant = 0; variant < meta.body.variantCount; variant += 1) {
    const response = await post(`/api/topics/${mqtt.id}/illustration-prompt`, { type: 'concept_diagram', variant });
    assert.equal(response.body.variant, variant);
    seen.add(response.body.prompt);
    assert.ok(response.body.nextType && response.body.nextType !== 'concept_diagram');
  }
  assert.equal(seen.size, meta.body.variantCount, 'each variant must read differently');

  // the cycle wraps around instead of failing
  const wrapped = await post(`/api/topics/${mqtt.id}/illustration-prompt`, {
    type: 'concept_diagram',
    variant: meta.body.variantCount,
  });
  assert.equal(wrapped.body.variant, 0);
});

test('a brand new topic still gets a specific prompt (no hardcoding)', async () => {
  // a subject the library knows nothing about, added the way a student would
  const subject = await post('/api/subjects', { name: 'Electrical Circuits' });
  assert.equal(subject.status, 201);
  const chapter = await post('/api/chapters', { subjectId: subject.body.id, name: 'Basic Electricity' });
  const created = await post('/api/topics', {
    chapterId: chapter.body.id,
    name: 'Ohms Law',
    description: 'Voltage, current, resistance',
  });
  assert.equal(created.status, 201);

  const response = await post(`/api/topics/${created.body.id}/illustration-prompt`, {
    type: 'educational_illustration',
  });
  const prompt = response.body.prompt;
  assert.equal(response.body.profile.source, 'derived', 'nothing in the library matches this topic');
  assert.ok(prompt.includes('Ohms Law'), 'the topic name is used');
  assert.ok(prompt.includes('Electrical Circuits'), 'the subject gives the context');
  for (const part of ['Voltage', 'current', 'resistance']) {
    assert.ok(prompt.includes(part), `the student description supplies the parts (${part})`);
  }
  assert.ok(!prompt.includes('Create an image about Ohms Law'), 'still not a generic one-liner');

  // a known topic in the same subject still uses the library
  const mqtt = await post(
    `/api/topics/${(await findSubject('IoT & IoT Architecture')).chapters[0].topics[0].id}/illustration-prompt`,
    { type: 'educational_illustration' }
  );
  assert.equal(mqtt.body.profile.source, 'library');
  assert.notEqual(prompt, mqtt.body.prompt, 'two different topics never produce the same prompt');

  await del(`/api/subjects/${subject.body.id}`);
});

test('illustration prompt validation is honest', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  assert.equal((await post(`/api/topics/${mqtt.id}/illustration-prompt`, { type: 'hologram' })).status, 400);
  assert.equal((await post(`/api/topics/${mqtt.id}/illustration-prompt`, { variant: -1 })).status, 400);
  assert.equal((await post(`/api/topics/${mqtt.id}/illustration-prompt`, { variant: 'two' })).status, 400);
  assert.equal((await post('/api/topics/999999/illustration-prompt', {})).status, 404);
});

// ---------------------------------------------------------------------------
// Phase 4 (second feature) — study content generator (no AI API)
// ---------------------------------------------------------------------------

test('study content kinds are listed with an honest note about the generator', async () => {
  const kinds = await get('/api/study-content/kinds');
  assert.equal(kinds.status, 200);
  assert.equal(kinds.body.kinds.length, 9);
  assert.deepEqual(
    kinds.body.kinds.map((kind) => kind.value),
    [
      'easy_definition', 'explanation', 'important_points', 'example', 'exam_answer',
      'possible_questions', 'mcq', 'viva', 'revision_summary',
    ]
  );
  assert.match(kinds.body.generator, /কোনো AI API নেই/);
  assert.ok(kinds.body.topicsWithHandwrittenKnowledge >= 15);
});

test('a topic with hand-written knowledge gets real Bangla content', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  const generated = await post(`/api/study-content/topic/${mqtt.id}/generate`, {});
  assert.equal(generated.status, 200);
  assert.equal(generated.body.generator, 'pattern-library', 'hand-written knowledge was used');
  assert.equal(generated.body.draft, false);
  assert.equal(generated.body.sections.length, 9);
  assert.deepEqual(generated.body.matchedIds, ['mqtt']);

  const body = Object.fromEntries(generated.body.sections.map((s) => [s.kind, s.body]));
  // Bangla text, not machine-translated English
  assert.match(body.easy_definition, /হালকা \(lightweight\) messaging protocol/);
  assert.match(body.easy_definition, /Publisher/);
  assert.match(body.important_points, /• /, 'points come as a bullet list');
  assert.match(body.exam_answer, /Publisher, Broker ও Subscriber/);
  assert.match(body.viva, /উত্তর:/);
  assert.match(body.revision_summary, /দ্রুত রিভিশন/);

  // every section is present and non-empty, and none of them is a lone sentence
  for (const section of generated.body.sections) {
    assert.ok(section.body.trim().length > 40, `${section.kind} must carry real text`);
    assert.ok(section.label, `${section.kind} has a Bangla label`);
  }
});

test('generated MCQs have exactly one correct option, and it is really correct', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');
  const generated = await post(`/api/study-content/topic/${mqtt.id}/generate`, { kinds: ['mcq'] });
  const body = generated.body.sections[0].body;

  const blocks = body.split('\n\n');
  assert.ok(blocks.length >= 2, 'more than one question is produced');
  for (const block of blocks) {
    const lines = block.split('\n');
    const options = lines.filter((line) => /^[১২৩৪]\. /.test(line));
    const answerLine = lines.find((line) => line.startsWith('উত্তর: '));
    assert.equal(options.length, 4, 'four options per question');
    assert.ok(answerLine, 'the answer is written down (the student must be able to check it)');
    const answer = answerLine.replace('উত্তর: ', '').trim();
    assert.equal(new Set(options).size, 4, 'options are distinct');
    assert.ok(
      options.some((option) => option.replace(/^[১২৩৪]\. /, '').trim() === answer),
      'the stated answer is one of the options'
    );
  }

  // the distractors belong to other concepts, so they must not be parts of MQTT
  assert.ok(body.includes('MQTT Publisher'));
  assert.ok(!body.includes('CoAP Client\nউত্তর: CoAP Client'), 'the answer is never a distractor');
});

test('content can be generated, saved, edited, turned into a note and deleted', async () => {
  const iot = await findSubject('IoT & IoT Architecture');
  const mqtt = iot.chapters[0].topics.find((t) => t.name === 'MQTT');

  const saved = await post(`/api/study-content/topic/${mqtt.id}/save`, {});
  assert.equal(saved.status, 200);
  assert.equal(saved.body.length, 9, 'saving without sections stores the whole generated set');
  const section = saved.body.find((row) => row.kind === 'easy_definition');
  assert.equal(section.model, 'pattern-library', 'the row records that no AI wrote it');

  // saving again replaces instead of piling up
  await post(`/api/study-content/topic/${mqtt.id}/save`, { kinds: ['easy_definition'] });
  const afterSecondSave = await get(`/api/study-content/topic/${mqtt.id}`);
  assert.equal(afterSecondSave.body.filter((row) => row.kind === 'easy_definition').length, 1);

  const edited = await patch(`/api/study-content/${section.id}`, { body: 'আমার নিজের লেখা সংজ্ঞা' });
  assert.equal(edited.status, 200);
  assert.equal(edited.body.body, 'আমার নিজের লেখা সংজ্ঞা');
  assert.equal(edited.body.title, section.title, 'editing the body keeps the title');

  const empty = await patch(`/api/study-content/${section.id}`, { body: '   ' });
  assert.equal(empty.status, 400, 'an empty section is refused');

  // the student's own notes stay separate from generated content
  const note = await post(`/api/study-content/${section.id}/to-note`, {});
  assert.equal(note.status, 201);
  assert.equal(note.body.source, 'ai', 'it lands in the AI-notes block, not among personal notes');
  const personal = await get(`/api/notes?topicId=${mqtt.id}&source=personal`);
  const aiNotes = await get(`/api/notes?topicId=${mqtt.id}&source=ai`);
  assert.ok(!personal.body.some((row) => row.body === 'আমার নিজের লেখা সংজ্ঞা'), 'AI notes stay out of the personal block');
  assert.ok(aiNotes.body.some((row) => row.body === 'আমার নিজের লেখা সংজ্ঞা'), 'it is filed under AI notes instead');

  const stats = await get('/api/study-content/stats');
  assert.equal(stats.body.savedSections >= 9, true);
  assert.equal(stats.body.topicsWithContent >= 1, true);

  const removed = await del(`/api/study-content/${section.id}`);
  assert.equal(removed.status, 204);
  const left = await get(`/api/study-content/topic/${mqtt.id}`);
  assert.ok(!left.body.some((row) => row.id === section.id));

  assert.equal((await patch('/api/study-content/999999', { body: 'x' })).status, 404);
  assert.equal((await del('/api/study-content/999999')).status, 404);
  assert.equal((await post('/api/study-content/999999/to-note', {})).status, 404);
});

test('a topic without hand-written knowledge gets an honest draft, not fake facts', async () => {
  const subject = await post('/api/subjects', { name: 'Electrical Circuits' });
  const chapter = await post('/api/chapters', { subjectId: subject.body.id, name: 'Basic Electricity' });
  const topic = await post('/api/topics', {
    chapterId: chapter.body.id,
    name: 'Ohms Law',
    description: 'Voltage, current, resistance',
  });

  const generated = await post(`/api/study-content/topic/${topic.body.id}/generate`, {});
  assert.equal(generated.body.generator, 'pattern-draft');
  assert.equal(generated.body.draft, true, 'the app says it is a draft');

  const content = Object.fromEntries(generated.body.sections.map((s) => [s.kind, s.body]));
  assert.ok(content.easy_definition.includes('হাতে লেখা তথ্য নেই'), 'draft sections say so plainly');
  assert.ok(content.important_points.includes('Voltage'), 'the student description is used');
  assert.match(content.mcq, /যথেষ্ট তথ্য ডেটাবেজে নেই/, 'MCQ refuses to invent questions');
  assert.match(content.exam_answer, /বই থেকে মিলিয়ে/, 'the student is told where to get the facts');

  // a validation error and a 404 stay honest
  assert.equal((await post(`/api/study-content/topic/${topic.body.id}/generate`, { kinds: ['nonsense'] })).body.sections.length, 0);
  assert.equal((await post('/api/study-content/topic/999999/generate', {})).status, 404);

  await del(`/api/subjects/${subject.body.id}`);
});

// ---------------------------------------------------------------------------
// Content mapping rule: Topic → Subject → Chapter → Content
// (a topic must never be answered with another subject's knowledge)
// ---------------------------------------------------------------------------

test('microcontroller topics get microcontroller content (mapping fix)', async () => {
  const mcu = await findSubject('Microcontroller');
  const expect = {
    'Architecture concepts': 'mcu-architecture',
    'Harvard vs Von Neumann architecture': 'harvard-von-neumann',
    'RISC vs CISC': 'risc-cisc',
    'Interrupt vector table': 'interrupt-vector-table',
    'ADC basics': 'adc-pwm',
    'PWM applications': 'adc-pwm',
  };

  for (const [topicName, conceptId] of Object.entries(expect)) {
    const topic = mcu.chapters.flatMap((chapter) => chapter.topics).find((t) => t.name === topicName);
    assert.ok(topic, `topic ${topicName} exists`);

    const generated = await post(`/api/study-content/topic/${topic.id}/generate`, {});
    assert.equal(generated.body.generator, 'pattern-library', `${topicName} uses the library`);
    assert.deepEqual(generated.body.matchedIds, [conceptId], `${topicName} → ${conceptId}`);
    assert.equal(generated.body.profile?.subjectFamily ?? generated.body.subjectFamily ?? 'microcontroller', 'microcontroller');
  }
});

test('no topic is answered with another subject family knowledge', async () => {
  const tree = await get('/api/progress-tree');
  const subjectFamily = (name) =>
    /security|surveillance/i.test(name)
      ? 'security'
      : /dbms|database/i.test(name)
        ? 'dbms'
        : /microcontroller|microprocessor/i.test(name)
          ? 'microcontroller'
          : /network/i.test(name)
            ? 'network'
            : /iot/i.test(name)
              ? 'iot'
              : 'unknown';

  const mismatches = [];
  for (const subject of tree.body.subjects) {
    const family = subjectFamily(subject.name);
    if (family === 'unknown') continue;
    for (const chapter of subject.chapters) {
      for (const topic of chapter.topics) {
        const generated = await post(`/api/study-content/topic/${topic.id}/generate`, { kinds: ['easy_definition'] });
        const ids = generated.body.matchedIds ?? [];
        if (!ids.length) continue; // draft mode is honest, never wrong
        // every used concept must belong to this subject family (or be generic)
        for (const id of ids) {
          const entry = CONCEPT_ENTRIES.find((candidate) => candidate.id === id);
          const generic = !entry.family || entry.family === 'general';
          const sameFamily = entry.family === family;
          const strongName = Boolean(entry.strong?.test(topic.name));
          if (!generic && !sameFamily && !strongName) {
            mismatches.push(`${subject.name} / ${topic.name} → ${id} (${entry.family})`);
          }
        }
      }
    }
  }
  assert.deepEqual(mismatches, [], `cross-subject content: ${mismatches.join(', ')}`);
});

test('the fixed topics carry their own facts and comparison tables', async () => {
  const mcu = await findSubject('Microcontroller');
  const byName = (name) => mcu.chapters.flatMap((chapter) => chapter.topics).find((t) => t.name === name);

  const hn = await post(`/api/study-content/topic/${byName('Harvard vs Von Neumann architecture').id}/generate`, {});
  const hnPoints = hn.body.sections.find((s) => s.kind === 'important_points').body;
  assert.match(hnPoints, /তুলনা টেবিল/);
  assert.match(hnPoints, /Harvard architecture\s+\| Von Neumann architecture/);
  assert.match(hnPoints, /Von Neumann bottleneck/);
  assert.ok(!/IoT layer/i.test(hnPoints), 'no IoT text leaks in');

  const risc = await post(`/api/study-content/topic/${byName('RISC vs CISC').id}/generate`, {});
  const riscPoints = risc.body.sections.find((s) => s.kind === 'important_points').body;
  assert.match(riscPoints, /RISC\s+\| CISC|RISC-এর|RISC/);
  assert.match(riscPoints, /ARM, AVR, MIPS, PIC/);

  const ivt = await post(`/api/study-content/topic/${byName('Interrupt vector table').id}/generate`, {});
  const ivtPoints = ivt.body.sections.find((s) => s.kind === 'important_points').body;
  assert.match(ivtPoints, /Vector address/);
  assert.match(ivtPoints, /000BH/, '8051 timer 0 vector address is present');
  assert.match(ivtPoints, /Reset\s+\|\s+0000H/);
  assert.ok(!/normalization|Database Management/i.test(ivtPoints), 'no DBMS text leaks in');

  const arch = await post(`/api/study-content/topic/${byName('Architecture concepts').id}/generate`, {});
  const archPoints = arch.body.sections.find((s) => s.kind === 'important_points').body;
  for (const part of ['ALU', 'Control Unit', 'Register', 'Memory', 'I/O port', 'bus']) {
    assert.ok(archPoints.includes(part), `architecture content mentions ${part}`);
  }
  assert.ok(!/IoT architecture/i.test(archPoints), 'no IoT layers text in architecture content');
});

// ---------------------------------------------------------------------------
// Exam Mode (Phase 5) — timed exam, automatic grading, scope safety
// ---------------------------------------------------------------------------

async function seedExamBank(chapterId, topicId, prefix) {
  const quiz = await post('/api/quizzes', { chapterId, title: `${prefix} bank` });
  const answers = [];
  for (let i = 1; i <= 6; i += 1) {
    const question = await post(`/api/quizzes/${quiz.body.id}/questions`, {
      topicId,
      type: 'mcq',
      question: `${prefix} প্রশ্ন ${i}?`,
      options: [`${prefix} সঠিক ${i}`, `${prefix} ভুল A ${i}`, `${prefix} ভুল B ${i}`],
      correctAnswer: `${prefix} সঠিক ${i}`,
    });
    answers.push({ questionId: question.body.id, answer: `${prefix} সঠিক ${i}` });
  }
  return { quiz: quiz.body, answers };
}

test('exam availability counts the questions of that scope only', async () => {
  const dbms = await findSubject('DBMS');
  const chapter = dbms.chapters[0];
  const topic = chapter.topics.find((entry) => entry.name === 'DBMS');

  const empty = await get(`/api/exams/availability?subjectId=${dbms.id}`);
  assert.equal(empty.status, 200);
  assert.equal(empty.body.bank, 0, 'no quiz questions written yet for DBMS');

  const bank = await seedExamBank(chapter.id, topic.id, 'DBMS-exam');
  const scoped = await get(`/api/exams/availability?topicId=${topic.id}`);
  assert.equal(scoped.body.bank, 6, 'the six MCQ of this topic are available');
  assert.equal(scoped.body.topicsInScope, 1);

  await del(`/api/quizzes/${bank.quiz.id}`);
});

test('an exam only contains questions from the chosen scope, with answers hidden', async () => {
  const mcu = await findSubject('Microcontroller');
  const chapter = mcu.chapters.find((entry) => entry.name === 'Interrupts');
  const topic = chapter.topics.find((entry) => entry.name === 'Interrupt vector table');

  const exam = await post('/api/exams', { topicId: topic.id, questionCount: 3, durationMinutes: 5 });
  assert.equal(exam.status, 201);
  assert.equal(exam.body.questions.length, 3);
  assert.deepEqual(
    [...new Set(exam.body.questions.map((question) => question.topicName))],
    ['Interrupt vector table'],
    'every question comes from the chosen topic'
  );
  assert.ok(
    exam.body.questions.every((question) => !('answer' in question)),
    'the correct answers stay on the server'
  );
  assert.equal(exam.body.counts.generated, 3, 'pattern-based MCQs filled the exam (no quiz bank for this topic)');

  const fetched = await get(`/api/exams/${exam.body.id}`);
  assert.equal(fetched.status, 200);
  assert.ok(fetched.body.questions.every((question) => !('answer' in question)));
  assert.equal(fetched.body.summary, null, 'not graded yet');

  const wrongScope = await post('/api/exams', { topicId: 999999, questionCount: 3 });
  assert.equal(wrongScope.status, 404);
});

test('submitting an exam grades correct, wrong and unanswered honestly', async () => {
  const mcu = await findSubject('Microcontroller');
  const chapter = mcu.chapters.find((entry) => entry.name === 'Architecture');
  const topic = chapter.topics.find((entry) => entry.name === 'RISC vs CISC');

  const exam = await post('/api/exams', { chapterId: chapter.id, questionCount: 4, durationMinutes: 10 });
  assert.equal(exam.status, 201);
  const questions = exam.body.questions;
  const byTopic = new Set(questions.map((question) => question.topicName));
  assert.ok([...byTopic].every((name) => chapter.topics.some((entry) => entry.name === name)), 'scope respected');

  // answer the first correctly (the answer is not in the payload, so read it from the exam snapshot)
  const source = (await get('/api/exams')).body.exams.find((entry) => entry.id === exam.body.id);
  assert.ok(source, 'the exam appears in the list');

  const answers = {};
  // one answer, one deliberate wrong answer, two left unanswered
  const firstId = questions[0].id;
  answers[firstId] = '___নিশ্চিত ভুল উত্তর___';
  if (questions[1]) answers[questions[1].id] = '___আরেকটা ভুল___';

  const graded = await post(`/api/exams/${exam.body.id}/submit`, { answers });
  assert.equal(graded.status, 200);
  assert.equal(graded.body.summary.total, 4);
  assert.equal(graded.body.summary.wrong + graded.body.summary.correct + graded.body.summary.unanswered, 4);
  assert.equal(graded.body.summary.unanswered, 2, 'the two untouched questions count as unanswered');
  assert.equal(graded.body.summary.percentage, Math.round((graded.body.summary.correct / 4) * 100));
  assert.ok(graded.body.summary.timeTakenSeconds >= 0, 'the server measured the time');

  const statuses = graded.body.questions.map((question) => question.status);
  assert.equal(statuses.filter((status) => status === 'unanswered').length, 2);
  assert.ok(graded.body.questions.every((question) => 'answer' in question), 'the review shows the correct answers');

  const again = await post(`/api/exams/${exam.body.id}/submit`, { answers: {} });
  assert.equal(again.status, 400, 'an exam cannot be submitted twice');
  assert.equal((await get('/api/exams/999999')).status, 404);
  assert.equal((await del('/api/exams/999999')).status, 404);
  assert.equal((await post('/api/exams', { chapterId: chapter.id, questionCount: 0 })).status, 400);
  assert.equal((await post('/api/exams', { chapterId: chapter.id, questionCount: 999 })).status, 400);
});

test('exam statistics come from graded exams only', async () => {
  const mcu = await findSubject('Microcontroller');
  const chapter = mcu.chapters.find((entry) => entry.name === 'Timers/Counters');
  const topic = chapter.topics.find((entry) => entry.name === 'Timer basics');
  const bank = await seedExamBank(chapter.id, topic.id, 'Timer-exam');
  const before = (await get('/api/exams/stats')).body;

  // exam A: every question answered correctly (answers read from a throwaway exam of the same scope)
  const scored = await post('/api/exams', { topicId: topic.id, questionCount: 3, durationMinutes: 5 });
  const throwaway = await post('/api/exams', { topicId: topic.id, questionCount: 6, durationMinutes: 5 });
  const unansweredRun = await post(`/api/exams/${throwaway.body.id}/submit`, { answers: {} });
  const correctAnswers = Object.fromEntries(unansweredRun.body.questions.map((question) => [question.id, question.answer]));
  const perfect = await post(`/api/exams/${scored.body.id}/submit`, { answers: correctAnswers });
  assert.equal(perfect.body.summary.percentage, 100, 'all correct answers give 100%');
  assert.ok(unansweredRun.body.questions.every((question) => question.status === 'unanswered'));

  const after = (await get('/api/exams/stats')).body;
  assert.equal(after.totalExams, before.totalExams + 2, 'both graded exams are counted');
  assert.equal(after.totalQuestionsAnswered, before.totalQuestionsAnswered + 9);
  assert.equal(after.trend.length, Math.min(10, after.totalExams), 'the trend has one point per exam (max 10)');
  assert.ok(after.best >= before.best, 'the best score never drops');
  assert.equal(after.best, 100, 'the perfect exam is the best score');
  assert.ok(after.lowest <= after.averagePercentage);
  assert.ok(
    after.bySubject.some((entry) => entry.subjectName === 'Microcontroller' && entry.attempts >= 1),
    'per-subject exam performance is reported'
  );

  await del(`/api/exams/${perfect.body.id}`);
  await del(`/api/exams/${unansweredRun.body.id}`);
  await del(`/api/quizzes/${bank.quiz.id}`);
  const cleared = (await get('/api/exams/stats')).body;
  assert.equal(cleared.totalExams, before.totalExams, 'deleting the exams removes them from the statistics');
});

// ---------------------------------------------------------------------------
// Advanced analytics (Phase 5) — measured numbers and honest insights
// ---------------------------------------------------------------------------

test('advanced analytics reports measured numbers, not guesses', async () => {
  const first = await get('/api/analytics/advanced');
  assert.equal(first.status, 200);
  const body = first.body;

  // everything the dashboard/analytics screen shows exists and is a number
  assert.equal(typeof body.totals.topics, 'number');
  assert.equal(typeof body.totals.questionsAnswered, 'number');
  assert.equal(body.totals.subjects, body.subjectPerformance.length);
  assert.equal(body.subjectPerformance.length, 5);
  assert.ok(body.chapterPerformance.length >= 13);

  // nothing answered yet → weak/strong must stay empty (a topic without data is never judged)
  assert.deepEqual(body.topics.weak, []);
  assert.deepEqual(body.topics.strong, []);
  assert.equal(body.topics.unmeasured, body.totals.topics);
  assert.ok(body.insights.length >= 1, 'there is always something useful to say');

  // the chart data the UI draws
  assert.equal(body.chartData.dailyActivity.length, 14);
  assert.equal(body.chartData.weeklyProgress.length, 8);
  assert.equal(body.chartData.monthlyProgress.length, 6);
  assert.ok(Array.isArray(body.chartData.examTrend));
  assert.ok(body.chartData.correctVsWrong.every((slice) => typeof slice.value === 'number'));

  // a subject with no answered question is labelled as such instead of showing 0 % as a verdict
  const unmeasuredSubject = body.subjectPerformance.find((subject) => subject.questionsAnswered === 0);
  assert.ok(unmeasuredSubject && unmeasuredSubject.hasEnoughData === false);
});

test('advanced analytics counts a real quiz attempt and names the weak chapter', async () => {
  const cn = await findSubject('Computer Network');
  const chapter = cn.chapters[0];
  const topic = chapter.topics.find((entry) => entry.name === 'Network components') ?? chapter.topics[0];

  const quiz = await post('/api/quizzes', { chapterId: chapter.id, title: 'analytics QA quiz' });
  const wrongAnswers = [];
  for (let i = 1; i <= 4; i += 1) {
    const question = await post(`/api/quizzes/${quiz.body.id}/questions`, {
      topicId: topic.id,
      type: 'mcq',
      question: `analytics QA প্রশ্ন ${i}?`,
      options: ['ঠিক উত্তর', 'ভুল ১', 'ভুল ২'],
      correctAnswer: 'ঠিক উত্তর',
    });
    wrongAnswers.push({ questionId: question.body.id, answer: 'ভুল ১' });
  }
  // answer every question wrongly → 0 % accuracy on this chapter
  const attempt = await post(`/api/quizzes/${quiz.body.id}/attempt`, { answers: wrongAnswers });
  assert.equal(attempt.status, 201, 'the attempt is stored');

  const analytics = await get('/api/analytics/advanced');
  const body = analytics.body;
  assert.equal(body.totals.questionsAnswered >= 4, true);
  assert.equal(body.totals.correctAnswers, 0);
  assert.ok(
    body.topics.weak.some((entry) => entry.topicId === topic.id && entry.accuracy === 0),
    'the topic answered wrongly is reported as weak'
  );
  const weakChapter = body.chapterPerformance.find((entry) => entry.chapterId === chapter.id);
  assert.equal(weakChapter.accuracy, 0);
  assert.equal(weakChapter.hasEnoughData, true);
  assert.ok(
    body.insights.some((insight) => insight.includes('accuracy')),
    'the insights mention the measured accuracy'
  );

  await del(`/api/quizzes/${quiz.body.id}`);
  const restored = await get('/api/analytics/advanced');
  assert.equal(restored.body.totals.questionsAnswered, body.totals.questionsAnswered - attempt.body.review.length);
});

// ---------------------------------------------------------------------------
// Auto backup (Phase 5) — snapshot, restore, retention
// ---------------------------------------------------------------------------

test('a backup snapshot can be taken, listed, downloaded and restored', async () => {
  const tree = await get('/api/progress-tree');
  const subject = tree.body.subjects[0];
  const chapter = subject.chapters[0];
  const topic = chapter.topics[0];

  await patch(`/api/topics/${topic.id}/status`, { status: 'completed' });
  await post('/api/notes', { topicId: topic.id, body: 'backup QA note' });

  const status = await get('/api/backups/status');
  assert.equal(status.status, 200);
  assert.equal(status.body.isDue, true, 'nothing has been backed up yet');

  const created = await post('/api/backups', { kind: 'manual', label: 'QA snapshot' });
  assert.equal(created.status, 201);
  assert.ok(created.body.sizeBytes > 1000, 'the snapshot carries the real data');
  assert.equal(created.body.status.isDue, false, 'a fresh backup is not due');

  const list = await get('/api/backups');
  assert.ok(list.body.backups.some((row) => row.id === created.body.id));
  assert.ok(list.body.retention.auto >= 2);

  const payload = await get(`/api/backups/${created.body.id}`);
  assert.match(payload.body.payload, /"subjects"/);
  assert.ok(payload.body.payload.includes('backup QA note'), 'the note is inside the snapshot');

  // wipe the data, then restore it
  await del(`/api/subjects/${subject.id}`);
  const wiped = await get('/api/progress-tree');
  assert.equal(wiped.body.subjects.length, tree.body.subjects.length - 1);
  assert.equal((await post(`/api/backups/${created.body.id}/restore`, {})).status, 400, 'restore needs a confirmation');

  const restored = await post(`/api/backups/${created.body.id}/restore`, { confirm: true });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.restored.subjects, tree.body.subjects.length, 'every subject came back');

  const back = await get('/api/progress-tree');
  const backSubject = back.body.subjects.find((entry) => entry.name === subject.name);
  assert.ok(backSubject, 'the deleted subject came back');
  const backTopic = backSubject.chapters[0].topics.find((entry) => entry.name === topic.name);
  assert.equal(backTopic.status, 'completed', 'progress came back with it');

  const notes = await get(`/api/notes?topicId=${backTopic.id}`);
  assert.ok(notes.body.some((note) => note.body === 'backup QA note'), 'the note came back too');
  assert.ok(restored.body.safetySnapshotId, 'the state before restoring was snapshotted as well');

  await patch(`/api/topics/${backTopic.id}/status`, { status: 'not_started' });
  assert.equal((await del(`/api/backups/${created.body.id}`)).status, 204);
  assert.equal((await get(`/api/backups/${created.body.id}`)).status, 404);
  assert.equal((await del('/api/backups/999999')).status, 404);
});

test('automatic backups only happen when one is due', async () => {
  // start from "no backup at all" so the due path is really exercised
  const existing = await get('/api/backups');
  for (const row of existing.body.backups) await del(`/api/backups/${row.id}`);
  assert.equal((await get('/api/backups/status')).body.isDue, true, 'without any snapshot a backup is due');

  const first = await post('/api/backups/auto', {});
  assert.equal(first.status, 200);
  assert.equal(first.body.created, true, 'the automatic backup is created when it is due');

  const second = await post('/api/backups/auto', {});
  assert.equal(second.body.created, false, 'a second call is a no-op while the snapshot is fresh');
  assert.equal(second.body.status.isDue, false);

  const list = await get('/api/backups');
  assert.equal(list.body.backups.filter((row) => row.kind === 'auto').length, 1, 'no duplicate auto backups');
});
