import { topicRepo } from '../repositories/topicRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import {
  buildIllustrationPrompt,
  ILLUSTRATION_TYPES,
  DEFAULT_ILLUSTRATION_TYPE,
} from './illustration/promptBuilder.js';
import { badRequest, notFound } from '../utils/http.js';

/**
 * Illustration prompt service (Phase 4, first feature).
 *
 * Reads ONE topic from the database together with its chapter and subject —
 * the same data the rest of the app uses — and hands it to the pure prompt
 * builder. No AI API is called and no key is needed: the student copies the
 * generated prompt into whatever image model they like.
 *
 * This module is the seam for the future: a later phase can add
 * `generateIllustration(prompt)` here (an image API call) and return image
 * bytes, while every existing caller of `illustrationPrompt()` keeps working
 * unchanged.
 */

export function listIllustrationTypes() {
  return {
    types: ILLUSTRATION_TYPES,
    defaultType: DEFAULT_ILLUSTRATION_TYPE,
    audience: 'Diploma in Computer Science & Technology (Bangladesh)',
    note: 'Prompt তৈরি হয় তোমার নিজের topic data থেকে — কোনো AI API বা API key লাগে না।',
  };
}

export function illustrationPrompt(userId, topicId, { type, variant } = {}) {
  const topic = topicRepo.findById(topicId);
  if (!topic) throw notFound('Topic not found');

  const chapter = chapterRepo.findById(topic.chapterId);
  if (!chapter) throw notFound('Chapter not found');

  const subject = subjectRepo.findById(chapter.subjectId);
  // a topic belongs to one user's subject — never build a prompt for someone else's data
  if (!subject || subject.userId !== userId) throw notFound('Topic not found');

  if (type && !ILLUSTRATION_TYPES.some((entry) => entry.value === type)) {
    throw badRequest(`type must be one of: ${ILLUSTRATION_TYPES.map((entry) => entry.value).join(', ')}`);
  }
  const wantedType = type ?? DEFAULT_ILLUSTRATION_TYPE;

  const variantNumber = variant === undefined || variant === null || variant === '' ? 0 : Number(variant);
  if (!Number.isInteger(variantNumber) || variantNumber < 0 || variantNumber > 99) {
    throw badRequest('variant must be a whole number between 0 and 99');
  }

  const built = buildIllustrationPrompt({ subject, chapter, topic, type: wantedType, variant: variantNumber });

  return {
    topicId: topic.id,
    subjectId: subject.id,
    chapterId: chapter.id,
    subject: { id: subject.id, name: subject.name, nameBn: subject.nameBn, color: subject.color },
    chapter: { id: chapter.id, name: chapter.name, nameBn: chapter.nameBn, number: chapter.number },
    topic: { id: topic.id, name: topic.name, nameBn: topic.nameBn, description: topic.description },
    ...built,
  };
}
