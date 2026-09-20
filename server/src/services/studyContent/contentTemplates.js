import { BANGLA_CONTENT } from './banglaContent.js';
import { CONCEPT_ENTRIES } from '../illustration/conceptLibrary.js';

/**
 * Turns a topic profile (see illustration/topicAnalyzer.js) into study content.
 *
 * Every section is a `kind` that the student can save, edit or regenerate
 * separately. The text is written in simple Bangladeshi-Diploma-student Bangla.
 *
 * Honesty rules (the reason this file is careful):
 *  - Nothing here is invented: each sentence comes either from the hand-written
 *    knowledge in banglaContent.js or from the topic's own name/description.
 *  - MCQs are built so that exactly one option is correct (the correct option is
 *    a real part of this concept, the distractors belong to other concepts), and
 *    the answer is marked clearly.
 *  - When a topic has no hand-written knowledge, the section is generated as a
 *    *draft skeleton* and says so — it never pretends to be finished content.
 */

export const CONTENT_KINDS = [
  { value: 'easy_definition', label: 'সহজ সংজ্ঞা', labelEn: 'Easy definition' },
  { value: 'explanation', label: 'ব্যাখ্যা', labelEn: 'Explanation' },
  { value: 'important_points', label: 'গুরুত্বপূর্ণ পয়েন্ট', labelEn: 'Important points' },
  { value: 'example', label: 'উদাহরণ', labelEn: 'Example' },
  { value: 'exam_answer', label: 'পরীক্ষার সংক্ষিপ্ত উত্তর', labelEn: 'Exam short answer' },
  { value: 'possible_questions', label: 'সম্ভাব্য প্রশ্ন', labelEn: 'Possible questions' },
  { value: 'mcq', label: 'MCQ', labelEn: 'Multiple choice questions' },
  { value: 'viva', label: 'Viva প্রশ্ন', labelEn: 'Viva questions' },
  { value: 'revision_summary', label: 'রিভিশন সামারি', labelEn: 'Revision summary' },
];

export const CONTENT_KIND_VALUES = CONTENT_KINDS.map((kind) => kind.value);

const BN_DIGITS = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
const bnNumber = (value) =>
  String(value)
    .split('')
    .map((char) => (/\d/.test(char) ? BN_DIGITS[Number(char)] : char))
    .join('');

/** "MQTT Broker (the central server)" -> "MQTT Broker" — options must stay short */
const shortLabel = (text) =>
  String(text)
    .split(' (')[0]
    .split(' — ')[0]
    .split(/[:.]/)[0]
    .trim()
    .slice(0, 46);

const bulletList = (items) => items.map((item) => `• ${item}`).join('\n');
const numberedList = (items) => items.map((item, index) => `${bnNumber(index + 1)}. ${item}`).join('\n');

/** Comparison tables / address tables written inside the concept knowledge. */
const tablesOf = (knowledge) => {
  const blocks = [];
  if (Array.isArray(knowledge?.compare) && knowledge.compare.length) {
    blocks.push(`তুলনা টেবিল:\n${knowledge.compare.join('\n')}`);
  }
  if (Array.isArray(knowledge?.table) && knowledge.table.length) {
    blocks.push(`টেবিল:\n${knowledge.table.join('\n')}`);
  }
  return blocks;
};

const knowledgeFor = (profile) => {
  // the first matched library entry with hand-written content wins
  for (const id of profile.matchedIds ?? []) {
    if (BANGLA_CONTENT[id]) return BANGLA_CONTENT[id];
  }
  return null;
};

/** Topics with no hand-written knowledge still get a usable, honest skeleton. */
const draftMode = (profile, topic, context) => {
  const description = String(topic.description ?? '').trim();
  const points = description
    ? description
        .split(/[,;\n•]/)
        .map((part) => part.trim())
        .filter(Boolean)
    : [];

  return {
    draft: true,
    definition: `${topic.name}${context.chapterName ? ` — ${context.chapterName} অধ্যায়ের` : ''} একটি গুরুত্বপূর্ণ topic।${
      description ? ` ${description}` : ''
    }\n\n(এখানে হাতে লেখা তথ্য নেই, তাই তোমার বই/নোট থেকে মূল কথাটা ২-৩ লাইনে লিখে রাখো।)`,
    points: points.length
      ? points.map((part) => `${part} — এর বিস্তারিত নিজের ভাষায় লেখো`)
      : [
          `${topic.name} কী, নিজের ভাষায় ২ লাইনে লেখো`,
          `${topic.name}-এর প্রধান অংশ বা ধাপগুলো লেখো`,
          `${topic.name} কেন দরকার / কাজে লাগে সেটা লেখো`,
          `একটা বাস্তব উদাহরণ খুঁজে লেখো`,
        ],
    steps: points.length ? points : [],
    example: `নিজের চারপাশ থেকে ${topic.name}-এর একটা বাস্তব উদাহরণ ভাবো (কোথায় ব্যবহার হয়?), তারপর সেটি ২ লাইনে লেখো।`,
    examAnswer: `${topic.name} নিয়ে পরীক্ষার উত্তর লেখার সময় এই তিন ধাপ রাখো —\n১. প্রথমে সংজ্ঞা\n২. তারপর প্রধান অংশ বা বৈশিষ্ট্য\n৩. শেষে একটা উদাহরণ বা ব্যবহার\n\n(মূল তথ্যটা তোমার বই থেকে মিলিয়ে নিয়ে এখানে লিখে ফেলো।)`,
    questions: [
      `${topic.name} কী?`,
      `${topic.name}-এর প্রধান অংশগুলো লেখো।`,
      `${topic.name}-এর ব্যবহার/উদাহরণ লেখো।`,
    ],
    viva: [
      { q: `${topic.name} সম্পর্কে এক লাইনে বলো।`, a: '(নিজের ভাষায় উত্তর তৈরি করো)' },
      { q: `${topic.name} কোথায় কাজে লাগে?`, a: '(একটা বাস্তব ব্যবহার বলো)' },
    ],
  };
};

/**
 * Structured MCQs for a topic (used by the content section AND by Exam Mode).
 * Returns [{ question, options[], answer }] — options are shuffled by the
 * caller when it matters (an exam), never here, so tests stay stable.
 */
export function buildMcqItems({ profile, topic, topicNameBn = '' }) {
  const knowledge = knowledgeFor(profile);
  const draft = knowledge ? null : draftMode(profile, topic, { chapterName: '', subjectName: '' });
  const items = buildMcq(profile, { ...topic, name: topic.name || topicNameBn }, knowledge, Boolean(draft));
  return items ?? [];
}

/**
 * Builds MCQs that are safe to trust: the correct option is a real part of this
 * topic, and every distractor is a real part of a *different* concept — so
 * exactly one option can be right. Distractors are not labelled, otherwise the
 * answer would be given away by the layout.
 */
function buildMcq(profile, topic, knowledge, draft) {
  const ownParts = (profile.components ?? [])
    .map((part) => shortLabel(part.split('—')[0]))
    .filter(Boolean);
  if (draft || ownParts.length < 2) return null;

  // Distractors are the short part-names of OTHER concepts ("MQTT Broker",
  // "Switch", "CPU"...) — plausible as options, and never part of this topic,
  // so exactly one answer can be correct.
  const otherParts = [];
  for (const entry of CONCEPT_ENTRIES) {
    if ((profile.matchedIds ?? []).includes(entry.id)) continue;
    for (const part of entry.components ?? []) otherParts.push(shortLabel(part));
  }
  const distractors = [...new Set(otherParts.filter(Boolean))].filter((option) => option.length > 2);
  const pick = (offset) => {
    const out = [];
    for (let i = 0; out.length < 3 && i < distractors.length; i += 1) {
      const candidate = distractors[(offset + i) % distractors.length];
      if (!ownParts.some((own) => own.toLowerCase() === candidate.toLowerCase())) out.push(candidate);
    }
    return out;
  };

  const questions = [];
  questions.push({
    question: `নিচের কোনটি ${topic.name}-এর অংশ?`,
    options: [ownParts[0], ...pick(0)].slice(0, 4),
    answer: ownParts[0],
  });
  if (ownParts[1]) {
    questions.push({
      question: `${topic.name}-এর সাথে কোনটি যুক্ত থাকে?`,
      options: [ownParts[1], ...pick(4)].slice(0, 4),
      answer: ownParts[1],
    });
  }

  // the "first step" question only when the real order is known (Bangla steps)
  const banglaSteps = knowledge?.steps ?? [];
  if (banglaSteps.length) {
    const otherSteps = Object.entries(BANGLA_CONTENT)
      .filter(([id]) => !(profile.matchedIds ?? []).includes(id))
      .map(([, entry]) => shortLabel(entry.steps?.[0] ?? ''))
      .filter(Boolean);
    questions.push({
      question: `${topic.name}-এ কাজটি কোন ধাপ দিয়ে শুরু হয়?`,
      options: [banglaSteps[0], ...otherSteps.slice(0, 3)].slice(0, 4),
      answer: banglaSteps[0],
    });
  }

  // each option list must have four distinct options
  return questions.filter((entry) => new Set(entry.options).size === 4);
}

function buildVivaQuestions(profile, topic, knowledge, draft) {
  if (draft || !knowledge) return draft?.viva ?? [];
  const extra = [
    ...(knowledge.viva ?? []),
    { q: `${topic.name}-এর প্রধান অংশগুলো বলো।`, a: (profile.components ?? []).map((part) => shortLabel(part.split('—')[0])).join(', ') },
  ];
  return extra.slice(0, 4);
}

/**
 * @param {object} input
 * @param {object} input.profile  output of analyzeTopic()
 * @param {object} input.topic    { name, nameBn, description }
 * @param {object} input.chapter  { name, number }
 * @param {object} input.subject  { name }
 * @param {string[]} [input.kinds] which sections to build (default: all)
 */
export function buildStudyContent({ profile, topic, chapter, subject, kinds = CONTENT_KIND_VALUES }) {
  const knowledge = knowledgeFor(profile);
  const context = {
    subjectName: subject?.name ?? '',
    chapterName: chapter?.name ?? '',
    chapterLabel: chapter ? `${chapter.number ? `Chapter ${chapter.number} — ` : ''}${chapter.name}` : '',
  };

  const draft = knowledge ? null : draftMode(profile, topic, context);
  const parts = (profile.components ?? []).map((part) => part.split('—')[0].trim()).filter(Boolean);
  const steps = profile.flow ?? [];
  const relationships = profile.relationships ?? [];
  const isDraft = Boolean(draft);

  const sections = {
    easy_definition: () => ({
      title: `${topic.name} — সহজ সংজ্ঞা`,
      body: (knowledge ?? draft).definition,
    }),

    explanation: () => {
      const source = knowledge ?? draft;
      const lines = [];
      lines.push(
        `${topic.name}${context.chapterLabel ? ` (${context.subjectName} → ${context.chapterLabel})` : ''} নিয়ে সহজভাবে দেখা যাক।`
      );
      if (parts.length) {
        lines.push('', 'এখানে প্রধান অংশগুলো হলো —');
        lines.push(bulletList(parts));
      }
      const shownSteps = knowledge?.steps?.length ? knowledge.steps : steps;
      if (shownSteps.length) {
        lines.push('', 'কাজটি ধাপে ধাপে এভাবে ঘটে —');
        lines.push(numberedList(shownSteps));
      }
      if (relationships.length) {
        lines.push('', 'কোন অংশ কার সাথে যুক্ত —');
        lines.push(bulletList(relationships));
      }
      const tables = isDraft ? [] : tablesOf(knowledge);
      if (tables.length) lines.push('', ...tables);
      lines.push(
        '',
        isDraft
          ? 'এই কাঠামোটা ধরে নিয়ে নিজের বই থেকে তথ্য বসিয়ে দাও — লিখে ফেললে সেটাই তোমার ব্যাখ্যা।'
          : (knowledge.points ?? []).slice(0, 2).join(' ')
      );
      return { title: `${topic.name} — ব্যাখ্যা`, body: lines.join('\n').trim() };
    },

    important_points: () => {
      const source = knowledge ?? draft;
      const points = [...new Set([...(source.points ?? []), ...(draft ? [] : [])])];
      const body = [bulletList(points.length ? points : ['(তথ্য যোগ করার জন্য জায়গা)']), ...tablesOf(knowledge)]
        .filter(Boolean)
        .join('\n\n');
      return { title: `${topic.name} — গুরুত্বপূর্ণ পয়েন্ট`, body };
    },

    example: () => ({
      title: `${topic.name} — উদাহরণ`,
      body: (knowledge ?? draft).example,
    }),

    exam_answer: () => ({
      title: `${topic.name} — পরীক্ষার সংক্ষিপ্ত উত্তর`,
      body: (knowledge ?? draft).examAnswer,
    }),

    possible_questions: () => ({
      title: `${topic.name} — সম্ভাব্য প্রশ্ন`,
      body: numberedList((knowledge ?? draft).questions ?? []),
    }),

    mcq: () => {
      const mcqs = buildMcq(profile, topic, knowledge, isDraft);
      if (!mcqs) {
        return {
          title: `${topic.name} — MCQ`,
          body: 'এই topic-এর জন্য নির্ভরযোগ্য MCQ বানানোর মতো যথেষ্ট তথ্য ডেটাবেজে নেই।\n\nনিজের বই থেকে প্রশ্ন লিখে নাও, অথবা Quiz পেজে নিজে MCQ যোগ করো — তখন সেটা সত্যি যাচাই হবে।',
        };
      }
      const body = mcqs
        .map((entry, index) => {
          const options = entry.options.map((option, i) => `${bnNumber(i + 1)}. ${option}`).join('\n');
          return `প্রশ্ন ${bnNumber(index + 1)}: ${entry.question}\n${options}\nউত্তর: ${entry.answer}`;
        })
        .join('\n\n');
      return { title: `${topic.name} — MCQ (উত্তর সহ)`, body };
    },

    viva: () => {
      const viva = buildVivaQuestions(profile, topic, knowledge, draft);
      const body = viva
        .map((entry, index) => `প্রশ্ন ${bnNumber(index + 1)}: ${entry.q}\nউত্তর: ${entry.a}`)
        .join('\n\n');
      return { title: `${topic.name} — Viva প্রশ্ন`, body };
    },

    revision_summary: () => {
      const source = knowledge ?? draft;
      const lines = [
        `দ্রুত রিভিশন — ${topic.name}`,
        '',
        `• এক লাইনে: ${(source.definition ?? '').split('\n')[0]}`,
      ];
      const points = (source.points ?? []).slice(0, 4);
      if (points.length) {
        lines.push('', 'মনে রাখার মতো:', bulletList(points));
      }
      if (parts.length) lines.push('', `অংশ: ${parts.map((part) => shortLabel(part)).join(' → ')}`);
      lines.push('', `পরীক্ষায় লিখবে: ${(source.examAnswer ?? '').split('\n')[0]}`);
      return { title: `${topic.name} — রিভিশন সামারি`, body: lines.join('\n').trim() };
    },
  };

  const wanted = kinds?.length ? kinds.filter((kind) => CONTENT_KIND_VALUES.includes(kind)) : CONTENT_KIND_VALUES;

  return {
    generator: isDraft ? 'pattern-draft' : 'pattern-library',
    draft: isDraft,
    matchedIds: profile.matchedIds ?? [],
    sections: wanted.map((kind) => {
      const built = sections[kind]();
      const meta = CONTENT_KINDS.find((entry) => entry.value === kind);
      return { kind, label: meta?.label ?? kind, labelEn: meta?.labelEn ?? kind, title: built.title, body: built.body };
    }),
  };
}
