import { aiContentRepo } from '../repositories/aiContentRepo.js';
import { noteRepo } from '../repositories/noteRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { analyzeTopic } from './illustration/topicAnalyzer.js';
import { buildStudyContent, CONTENT_KINDS, CONTENT_KIND_VALUES } from './studyContent/contentTemplates.js';
import { BANGLA_CONTENT, BANGLA_CONTENT_IDS } from './studyContent/banglaContent.js';
import { badRequest, notFound } from '../utils/http.js';

/**
 * Study content service (Phase 4, second feature).
 *
 * Generates the study material a student needs for one topic — easy definition,
 * explanation, important points, example, exam answer, possible questions, MCQ,
 * viva questions and a revision summary.
 *
 * IMPORTANT (and stated in the UI): there is NO AI API behind this. The text
 * comes from the hand-written Bangla knowledge in studyContent/banglaContent.js
 * plus template logic in studyContent/contentTemplates.js. Every response says
 * which generator produced it, so nothing is ever passed off as AI output.
 * Swapping in a real AI later only means adding a provider next to
 * `generateForTopic` — the saved data, routes and UI stay the same.
 */

function loadTopicContext(userId, topicId) {
  const topic = topicRepo.findById(topicId);
  if (!topic) throw notFound('Topic not found');
  const chapter = chapterRepo.findById(topic.chapterId);
  if (!chapter) throw notFound('Chapter not found');
  const subject = subjectRepo.findById(chapter.subjectId);
  if (!subject || subject.userId !== userId) throw notFound('Topic not found');
  return { topic, chapter, subject };
}

export function contentKinds() {
  return {
    kinds: CONTENT_KINDS,
    generator: 'pattern-based (কোনো AI API নেই)',
    topicsWithHandwrittenKnowledge: BANGLA_CONTENT_IDS.length,
    note: 'প্রতিটি section আলাদা করে edit/save/regen করা যায়। যে topic-এর হাতে লেখা তথ্য নেই, সেখানে খালি কাঠামো (draft) দেওয়া হয় — নিজে পূরণ করার জন্য।',
  };
}

/** Builds content for a topic without saving anything. */
export function generateForTopic(userId, topicId, { kinds, save = false } = {}) {
  const { topic, chapter, subject } = loadTopicContext(userId, topicId);

  const profile = analyzeTopic({
    subjectName: subject.name,
    chapterName: chapter.name,
    chapterNumber: chapter.number,
    topicName: topic.name,
    topicNameBn: topic.nameBn ?? '',
    description: topic.description ?? '',
  });

  const built = buildStudyContent({ profile, topic, chapter, subject, kinds });

  const sections = built.sections.map((section) => ({
    ...section,
    // what is already saved for this kind (so the UI can show "saved" vs "not saved")
    saved: (() => {
      const row = aiContentRepo.find(topic.id, section.kind);
      return row ? { id: row.id, updatedAt: row.updatedAt, title: row.title } : null;
    })(),
  }));

  const response = {
    topicId: topic.id,
    subject: { id: subject.id, name: subject.name, nameBn: subject.nameBn, color: subject.color },
    chapter: { id: chapter.id, name: chapter.name, nameBn: chapter.nameBn, number: chapter.number },
    topic: { id: topic.id, name: topic.name, nameBn: topic.nameBn, description: topic.description },
    generator: built.generator,
    draft: built.draft,
    matchedIds: built.matchedIds,
    sections,
  };

  if (save) {
    const saved = saveSections(userId, topicId, sections);
    return { ...response, sections: saved };
  }
  return response;
}

/** Saves the given sections (or every section if none are listed). */
export function saveSections(userId, topicId, sections) {
  const { topic } = loadTopicContext(userId, topicId);

  for (const section of sections) {
    if (!CONTENT_KIND_VALUES.includes(section.kind)) {
      throw badRequest(`kind must be one of: ${CONTENT_KIND_VALUES.join(', ')}`);
    }
    if (!String(section.body ?? '').trim()) throw badRequest('body cannot be empty');
    aiContentRepo.upsert({
      topicId: topic.id,
      userId,
      kind: section.kind,
      title: section.title ?? null,
      body: String(section.body).trim(),
      language: 'bn',
      model: section.model ?? 'pattern-library',
    });
  }

  activityRepo.record({
    userId,
    type: 'study_content_saved',
    topicId: topic.id,
    message: `Study content সংরক্ষণ হলো: "${topic.name}" (${sections.length}টা section)`,
  });

  return listByTopic(userId, topicId);
}

export function saveFromRequest(userId, topicId, body = {}) {
  if (Array.isArray(body.sections) && body.sections.length) {
    return saveSections(userId, topicId, body.sections);
  }
  // no sections given -> generate everything for this topic and store it
  const generated = generateForTopic(userId, topicId, { kinds: body.kinds });
  return saveSections(userId, topicId, generated.sections);
}

export function listByTopic(userId, topicId) {
  loadTopicContext(userId, topicId);
  return aiContentRepo
    .listByTopic(topicId)
    .filter((row) => row.userId === userId)
    .map((row) => ({
      ...row,
      label: CONTENT_KINDS.find((kind) => kind.value === row.kind)?.label ?? row.kind,
    }));
}

export function listAll(userId, limit = 50) {
  return {
    contents: aiContentRepo.listByUser(userId, Math.min(200, Math.max(1, Number(limit) || 50))),
    kinds: CONTENT_KINDS,
  };
}

export function updateContent(userId, contentId, body = {}) {
  const existing = aiContentRepo.findById(contentId);
  if (!existing || existing.userId !== userId) throw notFound('Content not found');
  if (body.body !== undefined && !String(body.body).trim()) throw badRequest('body cannot be empty');

  const updated = aiContentRepo.update(contentId, {
    title: body.title === undefined ? undefined : (String(body.title).trim() || null),
    body: body.body === undefined ? undefined : String(body.body).trim(),
  });

  activityRepo.record({
    userId,
    type: 'study_content_edited',
    topicId: existing.topicId,
    message: 'Study content সম্পাদনা করা হলো',
  });
  return updated;
}

export function deleteContent(userId, contentId) {
  const existing = aiContentRepo.findById(contentId);
  if (!existing || existing.userId !== userId) throw notFound('Content not found');
  return aiContentRepo.remove(contentId);
}

/**
 * Keeps generated content apart from the student's own notes: this writes into
 * the notes table with source 'ai', which the notes UI shows in its own block.
 */
export function saveAsNote(userId, contentId) {
  const content = aiContentRepo.findById(contentId);
  if (!content || content.userId !== userId) throw notFound('Content not found');

  const note = noteRepo.create({
    topicId: content.topicId,
    userId,
    source: 'ai',
    title: content.title ?? 'Generated content',
    body: content.body,
  });

  activityRepo.record({
    userId,
    type: 'note_added',
    topicId: content.topicId,
    message: `Generated content নোট হিসেবে যোগ হলো: "${content.title ?? content.kind}"`,
  });
  return note;
}

/** Small report so the UI can show how much has been generated already. */
export function contentStats(userId) {
  const contents = aiContentRepo.listByUser(userId, 500);
  const topics = new Set(contents.map((row) => row.topicId));
  return {
    savedSections: contents.length,
    topicsWithContent: topics.size,
    byKind: CONTENT_KINDS.map((kind) => ({
      kind: kind.value,
      label: kind.label,
      count: contents.filter((row) => row.kind === kind.value).length,
    })),
    generator: 'pattern-based (কোনো AI API নেই)',
    handwrittenKnowledgeTopics: BANGLA_CONTENT_IDS.length,
  };
}

export { CONTENT_KINDS, BANGLA_CONTENT };
