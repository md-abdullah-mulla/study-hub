import { subjectRepo } from '../repositories/subjectRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { badRequest } from '../utils/http.js';

/**
 * IMPORT CHAPTER (spec §22)
 * Paste a list like:
 *   Subject: IoT
 *   Chapter: Chapter 1
 *   Topics:
 *   Definition
 *   Uses of IoT
 *   - MQTT
 * and the structure is created automatically. Duplicates are skipped.
 */

const BULLET = /^\s*(?:[-*•–—]|\d{1,3}[.)।]|[০-৯]{1,3}[.)।])\s*/;
const SUBJECT_LINE = /^\s*(?:subject|বিষয়)\s*[:\-–]\s*(.+)$/i;
const CHAPTER_LINE = /^\s*(?:chapter|অধ্যায়|অধ্যায়)\s*[:\-–]?\s*(.+)$/i;
const TOPICS_HEADER = /^\s*(?:topics?|টপিক|বিষয়বস্তু|topics? list)\s*[:\-–]?\s*$/i;
const CHAPTER_NUMBER = /^\s*(?:chapter|অধ্যায়)?\s*([0-9০-৯]{1,3})\s*[:\-–.]?\s*(.*)$/i;

const BN_DIGITS = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };

function bnToEnDigits(text) {
  return String(text).replace(/[০-৯]/g, (d) => BN_DIGITS[d] ?? d);
}

export function parseImportText(rawText) {
  if (!rawText || !String(rawText).trim()) throw badRequest('Paste some text first');

  const lines = String(rawText).replace(/\r\n?/g, '\n').split('\n');
  const result = { subjectName: null, chapterName: null, topics: [] };
  const warnings = [];
  let inTopics = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (SUBJECT_LINE.test(line)) {
      result.subjectName = line.match(SUBJECT_LINE)[1].trim();
      inTopics = false;
      continue;
    }
    if (CHAPTER_LINE.test(line)) {
      let chapterText = line.match(CHAPTER_LINE)[1].trim();
      const numbered = bnToEnDigits(chapterText).match(CHAPTER_NUMBER);
      if (numbered && numbered[1]) {
        const number = Number(numbered[1]);
        const rest = (numbered[2] ?? '').trim();
        chapterText = rest ? `Chapter ${number}: ${rest}` : `Chapter ${number}`;
      }
      result.chapterName = chapterText;
      inTopics = false;
      continue;
    }
    if (TOPICS_HEADER.test(line)) {
      inTopics = true;
      continue;
    }

    // anything else is a topic
    const name = bnToEnDigits(line.replace(BULLET, '').trim());
    if (!name) continue;
    if (!inTopics) inTopics = true;
    if (name.length > 120) warnings.push(`Topic name is very long, shortened: ${name.slice(0, 40)}...`);
    if (!result.topics.includes(name)) result.topics.push(name.slice(0, 120));
  }

  if (!result.subjectName) warnings.push('Subject পাওয়া যায়নি — উপরে Subject select করতে হবে');
  if (!result.chapterName) warnings.push('Chapter name পাওয়া যায়নি — "Chapter 1" লিখুন');
  if (!result.topics.length) warnings.push('কোনো topic পাওয়া যায়নি');

  return { ...result, warnings };
}

export function chapterNumberFromName(name) {
  const match = bnToEnDigits(name ?? '').match(/(\d{1,3})/);
  return match ? Number(match[1]) : null;
}

/** Clean a pasted chapter name ("Chapter 1: Network Basics" -> "Network Basics"). */
export function cleanChapterName(name, number) {
  if (!name) return number ? `Chapter ${number}` : 'Chapter 1';
  const withoutPrefix = name.replace(/^\s*(?:chapter|অধ্যায়)\s*[0-9০-৯]{0,3}\s*[:\-–.]?\s*/i, '').trim();
  if (!withoutPrefix) return `Chapter ${number ?? 1}`;
  return withoutPrefix;
}

/**
 * Applies a parsed (and user-reviewed) import.
 * payload: { subjectId?, subjectName?, chapterId?, chapterNumber?, chapterName?, topics: string[] }
 */
export function applyImport(userId, payload) {
  const topicNames = (payload.topics ?? []).map((t) => String(t).trim()).filter(Boolean);
  if (!topicNames.length) throw badRequest('At least one topic is required');

  let subject = payload.subjectId ? subjectRepo.findById(payload.subjectId) : null;
  let subjectCreated = false;
  if (!subject) {
    const name = (payload.subjectName ?? '').trim();
    if (!name) throw badRequest('subjectId অথবা subjectName দিতে হবে');
    subject = subjectRepo.findByName(userId, name) ?? null;
    if (!subject) {
      subject = subjectRepo.create({ userId, name });
      subjectCreated = true;
      activityRepo.record({
        userId,
        type: 'subject_created',
        subjectId: subject.id,
        message: `নতুন subject যোগ হয়েছে: ${subject.name}`,
      });
    }
  }

  let chapter = payload.chapterId ? chapterRepo.findById(payload.chapterId) : null;
  let chapterCreated = false;
  const rawName = payload.chapterName ?? (payload.chapterNumber ? `Chapter ${payload.chapterNumber}` : '');
  const number = payload.chapterNumber ?? chapterNumberFromName(rawName) ?? chapterRepo.nextNumber(subject.id);

  if (!chapter) {
    const name = cleanChapterName(rawName, number);
    chapter = chapterRepo.findByName(subject.id, name) ?? null;
    if (!chapter) {
      chapter = chapterRepo.create({ subjectId: subject.id, number, name });
      chapterCreated = true;
      activityRepo.record({
        userId,
        type: 'chapter_created',
        subjectId: subject.id,
        chapterId: chapter.id,
        message: `নতুন chapter যোগ হয়েছে: ${subject.name} → Chapter ${chapter.number}: ${chapter.name}`,
      });
    }
  }

  const existing = new Set(topicRepo.listByChapter(chapter.id).map((t) => t.name.toLowerCase()));
  const created = [];
  const skipped = [];
  for (const name of topicNames) {
    if (existing.has(name.toLowerCase())) {
      skipped.push(name);
      continue;
    }
    created.push(topicRepo.create({ chapterId: chapter.id, name }));
    existing.add(name.toLowerCase());
  }

  if (created.length) {
    activityRepo.record({
      userId,
      type: 'topics_imported',
      subjectId: subject.id,
      chapterId: chapter.id,
      message: `${created.length}টি topic import হয়েছে — ${subject.name} → Chapter ${chapter.number}`,
      meta: { count: created.length },
    });
  }

  return {
    subject,
    chapter,
    subjectCreated,
    chapterCreated,
    createdCount: created.length,
    skippedCount: skipped.length,
    skipped,
    preview: `${subject.name} → Chapter ${chapter.number}: ${chapter.name} → ${created.length}টি topic`,
  };
}
