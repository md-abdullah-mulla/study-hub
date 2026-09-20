import { analyzeTopic } from './topicAnalyzer.js';
import {
  ILLUSTRATION_TEMPLATES,
  ILLUSTRATION_TYPES,
  DEFAULT_ILLUSTRATION_TYPE,
  findTemplate,
  nextIllustrationType,
} from './promptTemplates.js';

/**
 * Builds the final image-generation prompt as plain text.
 *
 * No AI service is involved: the topic data (subject → chapter → topic), the
 * concept profile and the chosen template are simply written into a structured
 * English prompt that the student pastes into ChatGPT / Gemini / any image
 * model.
 *
 * Entry points both the route and any future AI provider can reuse:
 *   buildIllustrationPrompt({ subject, chapter, topic, type, variant })
 *     -> { prompt, type, typeLabel, variant, variantCount, nextType, profile }
 *
 * Phase-5 note: an AI provider would take this same prompt string and return an
 * image. Nothing else in the app needs to change — that is why the prompt
 * building lives in its own module instead of inside the route.
 */
export const AUDIENCE =
  'Designed for a Bangladeshi Diploma-level Computer Science and Technology student, for their own study notes.';

const DESIGN_RULES = [
  'Style: clean, modern educational textbook illustration — flat vector look with soft, muted colours',
  'Layout: generous white background, clear grouping, no crowded corners',
  'Labels: short English labels (one to four words each), spelled correctly, large enough to read at a glance',
  'Arrows: thin, straight and clearly directional, with arrowheads that show the real direction of flow',
  'Keep the amount of text low — the picture should explain the idea, not repeat a paragraph',
];

const AVOID_RULES = [
  'No decorative or unrelated elements (no plants, no cartoon mascots, no random icons, no watermarks, no logos)',
  'No dense paragraphs of text inside the image and no overlapping labels',
  'No technical detail that the topic does not have — every part shown must belong to the concept',
  'No 3D clutter, heavy shadows or photorealistic rendering when a diagram is asked for',
];

const wrap = (text, width = 96) => {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    if ((line + ' ' + word).trim().length > width) {
      lines.push(line.trim());
      line = word;
    } else {
      line = `${line} ${word}`;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.join('\n');
};

const bullet = (items) => items.map((item) => `- ${wrap(item)}`).join('\n');
const numbered = (items) => items.map((item, index) => `${index + 1}. ${wrap(item)}`).join('\n');

/**
 * Library components read like "MQTT Broker (the central message server)".
 * The picture needs the short label; the text in brackets is what the student
 * learns. Splitting them keeps in-image labels short and readable.
 */
const splitComponent = (part) => {
  const match = String(part).match(/^(.+?)\s*\((.+)\)\s*$/);
  if (!match) return { label: String(part).trim(), note: null };
  return { label: match[1].trim(), note: match[2].trim() };
};

/**
 * @param {object} input
 * @param {{name: string, nameBn?: string}} input.subject
 * @param {{name: string, number?: number, nameBn?: string}} input.chapter
 * @param {{name: string, nameBn?: string, description?: string}} input.topic
 * @param {string} [input.type]     illustration type (default: educational_illustration)
 * @param {number} [input.variant]  which variant of that type (default: 0)
 */
export function buildIllustrationPrompt({ subject, chapter, topic, type, variant = 0 } = {}) {
  const template = findTemplate(type) ?? findTemplate(DEFAULT_ILLUSTRATION_TYPE);
  const variantIndex = ((Number(variant) || 0) % template.variants.length + template.variants.length) % template.variants.length;
  const currentVariant = template.variants[variantIndex];

  const subjectName = subject?.name ?? 'Computer Science';
  const chapterName = chapter?.name ?? '';
  const topicName = topic?.name ?? '';
  const chapterLabel = chapterName
    ? `${chapter?.number ? `Chapter ${chapter.number} — ` : ''}${chapterName}`
    : '';

  const analysis = analyzeTopic({
    subjectName,
    chapterName,
    chapterNumber: chapter?.number ?? null,
    topicName,
    topicNameBn: topic?.nameBn ?? '',
    description: topic?.description ?? '',
  });

  const componentRows = analysis.components.map(splitComponent);
  const componentLines = componentRows.map(({ label, note }) => (note ? `${label} — ${note}` : label));

  const context = {
    components: componentLines,
    componentLabels: componentRows.map(({ label }) => label),
    flow: analysis.flow,
    relationships: analysis.relationships,
    keywords: analysis.keywords,
    summary: analysis.oneLine ?? analysis.concept,
  };

  const templateSections = template.sections(context)
    .filter((section) => section.lines?.length)
    .map((section) => `${section.heading}\n${numbered(section.lines)}`)
    .join('\n\n');

  const labelRule = componentRows.some(({ note }) => note)
    ? `Label each part in the picture with its short English name only (for example "${componentRows[0].label}") — put the explanation in your head, not in the image.`
    : 'Label every part in the picture with a short English name of one to four words.';

  const prompt = [
    `Create a clean and simple ${template.label.toLowerCase()} that explains "${topicName}" for a Diploma-level Computer Science student.`,
    '',
    'CONTEXT',
    `Subject: ${subjectName}${subject?.nameBn ? ` (${subject.nameBn})` : ''}`,
    chapterLabel ? `Chapter: ${chapterLabel}` : null,
    `Topic: ${topicName}${topic?.nameBn ? ` (${topic.nameBn})` : ''}`,
    `Illustration type: ${template.label}`,
    `Purpose: ${template.focus}`,
    '',
    'WHAT THE CONCEPT IS',
    wrap(analysis.concept),
    '',
    templateSections,
    '',
    'HOW TO ARRANGE THE PICTURE',
    wrap(`Use ${currentVariant.layout}.`),
    '',
    'DESIGN INSTRUCTIONS',
    bullet([...DESIGN_RULES, labelRule]),
    '',
    'AVOID',
    bullet(AVOID_RULES),
    '',
    'AUDIENCE',
    wrap(AUDIENCE),
    '',
    'FINAL CHECK',
    wrap(
      'The finished illustration must be easy to understand at a glance, technically correct, and good enough to paste into a student’s study notes about ' +
        `${topicName}${chapterName ? ` (${chapterName})` : ''}.`
    ),
    analysis.keywords.length
      ? `\nTerminology that should appear correctly: ${analysis.keywords.join(', ')}.`
      : null,
  ]
    .filter((part) => part !== null)
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  return {
    prompt,
    type: template.value,
    typeLabel: template.label,
    typeLabelBn: template.labelBn,
    variant: variantIndex,
    variantCount: template.variants.length,
    variantId: currentVariant.id,
    nextType: nextIllustrationType(template.value),
    profile: {
      source: analysis.source,
      matchedIds: analysis.matchedIds ?? [],
      signal: analysis.signal,
      components: analysis.components,
      flow: analysis.flow,
      relationships: analysis.relationships,
      keywords: analysis.keywords,
    },
  };
}

export { ILLUSTRATION_TYPES, DEFAULT_ILLUSTRATION_TYPE, ILLUSTRATION_TEMPLATES };
