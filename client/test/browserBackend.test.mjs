import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import initSqlJs from 'sql.js';
import { createBrowserBackend } from '../src/browser-db/backend.js';
import { installFetchBridge } from '../src/browser-db/fetchBridge.js';

/**
 * Tests for the GitHub Pages / no-server mode.
 *
 * The same route files, services and repositories the Node server runs are
 * mounted on the in-browser router (see test/alias-loader.mjs), on top of a
 * sql.js database, with a fake storage object standing in for IndexedDB.
 *
 * Run: npm run test:browser
 */
const here = path.dirname(fileURLToPath(import.meta.url));
const schemaSql = fs.readFileSync(path.resolve(here, '..', '..', 'server', 'src', 'db', 'schema.sql'), 'utf8');

const SQL = await initSqlJs();
after(() => SQL.close?.());

/** in-memory stand-in for IndexedDB (idbStorage is exercised separately) */
function createMemoryStorage() {
  const map = new Map();
  return {
    persistent: true,
    get: async (key) => map.get(key) ?? null,
    set: async (key, value) => void map.set(key, value),
    remove: async (key) => void map.delete(key),
    size: () => map.size,
  };
}

const json = (response) => JSON.parse(response.body);

test('a fresh browser backend is seeded with the Semester 6 structure', async () => {
  const backend = await createBrowserBackend({ SQL, schemaSql });
  const dashboard = json(await backend.handle({ path: '/api/dashboard' }));

  assert.equal(dashboard.overall.totalSubjects, 5);
  assert.equal(dashboard.overall.totalTopics, 77);
  assert.equal(dashboard.overall.totalChapters, 13);
  assert.equal(dashboard.overall.percent, 0, 'nothing may be pre-completed');
  assert.equal(dashboard.todayPlan.length >= 1, true);
  assert.ok(dashboard.recommendation.reasons.length >= 2, 'recommendation explains itself');
  assert.equal(backend.seeded.subjects, 5, 'first run creates the structure');
});

test('progress maths, revision schedule and the plan behave like the server', async () => {
  const backend = await createBrowserBackend({ SQL, schemaSql });

  const tree = json(await backend.handle({ path: '/api/progress-tree' }));
  const iot = tree.subjects.find((s) => s.name.startsWith('IoT'));
  const chapter = iot.chapters[0];
  assert.equal(chapter.progress.total, 12);

  for (const topic of chapter.topics.slice(0, 8)) {
    const response = await backend.handle({ method: 'PATCH', path: `/api/topics/${topic.id}/status`, body: { status: 'completed' } });
    assert.equal(response.status, 200);
  }

  const after = json(await backend.handle({ path: '/api/progress-tree' }));
  const iotAfter = after.subjects.find((s) => s.name.startsWith('IoT'));
  assert.equal(iotAfter.progress.percent, 67, '8/12 = 67%');
  assert.equal(after.semester.progress.percent, 10, '8/77 = 10%');
  assert.ok(iotAfter.chapters[0].topics[0].nextRevisionAt, 'revision date scheduled');

  // needs_revision keeps the credit, un-tick honest
  const firstTopic = iotAfter.chapters[0].topics[1];
  await backend.handle({ method: 'PATCH', path: `/api/topics/${firstTopic.id}/status`, body: { status: 'needs_revision' } });
  const withRevision = json(await backend.handle({ path: '/api/dashboard' }));
  assert.equal(withRevision.overall.percent, 10, 'progress must not drop');
  assert.equal(withRevision.overall.revisionDueCount, 1);

  const queue = json(await backend.handle({ path: '/api/statuses/revision-queue' }));
  assert.equal(queue.length, 1);
});

test('browser mode: subject → chapter → topic CRUD, notes, search and import', async () => {
  const backend = await createBrowserBackend({ SQL, schemaSql });

  const created = await backend.handle({ method: 'POST', path: '/api/subjects', body: { name: 'QA Browser Subject' } });
  assert.equal(created.status, 201);
  const subject = json(created);

  const chapter = json(await backend.handle({ method: 'POST', path: '/api/chapters', body: { subjectId: subject.id, name: 'First chapter' } }));
  const topic = json(await backend.handle({ method: 'POST', path: '/api/topics', body: { chapterId: chapter.id, name: 'QA topic' } }));

  await backend.handle({ method: 'PATCH', path: `/api/topics/${topic.id}/status`, body: { status: 'completed' } });
  const noteResponse = await backend.handle({ method: 'POST', path: '/api/notes', body: { topicId: topic.id, body: 'MQTT broker note' } });
  assert.equal(noteResponse.status, 201);

  const search = json(await backend.handle({ path: '/api/search', search: '?q=broker' }));
  assert.equal(search.total, 1, 'notes are searchable');
  assert.equal(search.notes[0].subjectName, 'QA Browser Subject');

  const parsed = json(await backend.handle({ method: 'POST', path: '/api/import/parse', body: { text: 'Subject: IoT & IoT Architecture\nChapter: Chapter 9\nTopics:\n- Alpha\n- Beta' } }));
  assert.deepEqual(parsed.topics, ['Alpha', 'Beta']);

  const applied = json(await backend.handle({
    method: 'POST',
    path: '/api/import/apply',
    body: { subjectId: 2, chapterNumber: 9, chapterName: 'Chapter 9', topics: parsed.topics },
  }));
  assert.equal(applied.createdCount, 2);

  const removed = await backend.handle({ method: 'DELETE', path: `/api/subjects/${subject.id}` });
  assert.equal(removed.status, 204);
  const afterDelete = json(await backend.handle({ path: '/api/progress-tree' }));
  assert.equal(afterDelete.subjects.some((s) => s.name === 'QA Browser Subject'), false, 'cascade delete works');
});

test('browser mode: exports, 404 and validation answers match the server', async () => {
  const backend = await createBrowserBackend({ SQL, schemaSql });

  const backup = json(await backend.handle({ path: '/api/export/backup' }));
  assert.ok(backup.subjects.length >= 5);
  assert.ok('notes' in backup && 'studyPlan' in backup);

  const csv = await backend.handle({ path: '/api/export/topics.csv' });
  assert.match(csv.headers['content-type'], /text\/csv/);
  assert.match(csv.body.split('\n')[0], /^subject,chapter_number,chapter_name,topic/);

  assert.equal(json(await backend.handle({ path: '/api/does-not-exist' })).error, 'Route not found');
  assert.equal((await backend.handle({ method: 'POST', path: '/api/subjects', body: {} })).status, 400);
  assert.equal((await backend.handle({ method: 'PATCH', path: '/api/topics/1/status', body: { status: 'done' } })).status, 400);
  assert.equal((await backend.handle({ path: '/api/topics/999999' })).status, 404);
  assert.equal((await backend.handle({ method: 'PATCH', path: '/api/plan/999999', body: { isDone: true } })).status, 404);
});

test('data survives a reload: bytes are persisted and restored', async () => {
  const storage = createMemoryStorage();

  const first = await createBrowserBackend({ SQL, schemaSql, storage });
  const tree = json(await first.handle({ path: '/api/progress-tree' }));
  const topic = tree.subjects[1].chapters[0].topics[0];

  await first.handle({ method: 'PATCH', path: `/api/topics/${topic.id}/status`, body: { status: 'completed' } });
  await first.handle({ method: 'PATCH', path: `/api/topics/${topic.id}`, body: { description: 'persisted description' } });
  first.flush();

  assert.ok(storage.size() > 0, 'database bytes were written to storage');

  // "reload": new backend instance built from the saved bytes
  const saved = await storage.get('database');
  const second = await createBrowserBackend({ SQL, schemaSql, data: saved, storage });

  const restored = json(await second.handle({ path: '/api/progress-tree' }));
  const restoredTopic = restored.subjects[1].chapters[0].topics.find((t) => t.id === topic.id);
  assert.equal(restoredTopic.status, 'completed', 'progress survived the reload');
  assert.equal(restoredTopic.description, 'persisted description', 'edits survived the reload');
  assert.equal(restored.semester.progress.completed, 1);
  assert.equal(second.seeded.subjects, 0, 'seeding is idempotent — nothing duplicated');
  assert.equal(restored.subjects.length, 5);
});

test('the fetch bridge answers /api locally and leaves other URLs alone', async () => {
  const backend = await createBrowserBackend({ SQL, schemaSql });

  const passthrough = [];
  const fakeFetch = async (url) => {
    passthrough.push(String(url));
    return new Response('from network', { status: 200 });
  };

  const restore = installFetchBridge(backend.handle, { fetchImpl: fakeFetch, baseHref: 'https://example.github.io/study-hub/' });
  try {
    const dashboard = await fetch('/api/dashboard');
    assert.equal(dashboard.status, 200);
    const payload = await dashboard.json();
    assert.equal(payload.overall.totalSubjects, 5, 'served from the in-page database');

    const status = await fetch('/api/topics/1/status', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'studying' }),
    });
    assert.equal(status.status, 200);
    assert.equal((await status.json()).status, 'studying');

    // absolute URLs with the deployment base path must work too
    const absolute = await fetch('https://example.github.io/study-hub/api/meta');
    assert.equal((await absolute.json()).semester, 6);

    // non-API requests fall through to the real network
    await fetch('/study-hub/assets/logo.svg');
    assert.deepEqual(passthrough, ['/study-hub/assets/logo.svg'], 'only /api was intercepted');
  } finally {
    restore();
  }
});
