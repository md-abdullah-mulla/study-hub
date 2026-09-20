import { CONCEPT_ENTRIES, STOPWORDS } from './conceptLibrary.js';

/**
 * Turns one Topic (with its Chapter and Subject) into a *profile* the prompt
 * builder can write about: what the concept is, which parts it has, how those
 * parts connect, and what kind of picture explains it best.
 *
 * Two sources, in this order:
 *  1. the curated library (conceptLibrary.js) — several entries may match, e.g.
 *     "File System vs DBMS" matches both the DBMS and the file-system entries
 *  2. a derivation from the topic's own words (name, Bangla name, description,
 *     chapter, subject) — so a topic added tomorrow still gets a specific
 *     prompt instead of a generic one
 *
 * Pure function: no database, no filesystem, no network. That is what lets the
 * same generator run on the server and inside the browser-only Pages build.
 */

/**
 * Which subject family a topic belongs to.
 *
 * This is the rule that stops one subject's knowledge from leaking into another
 * subject's topic: a concept is only used when its own family matches the topic's
 * subject (or when the topic name itself is unambiguous — see `matchesFamily`).
 * The order matters: "Security-Based Surveillance System" must be security, not
 * IoT, and "IoT & IoT Architecture" must stay IoT even though it says
 * "architecture".
 */
const FAMILY_RULES = [
  { family: 'security', test: /\b(security|surveillance|cctv|access control)\b/i },
  { family: 'dbms', test: /\b(dbms|database|rdbms|sql)\b/i },
  { family: 'microcontroller', test: /\b(microcontroller|microprocessor|embedded|8051|avr|pic|interrupt)\b/i },
  { family: 'network', test: /\b(computer network|networking|data communication|network)\b/i },
  { family: 'iot', test: /\b(iot|internet of things|smart device|sensor)\b/i },
];

export function detectSubjectFamily(subjectName = '', chapterName = '') {
  const text = `${subjectName} ${chapterName}`;
  for (const rule of FAMILY_RULES) if (rule.test.test(text)) return rule.family;
  return 'unknown';
}

/** How the picture should be laid out, decided from the words themselves. */
const SIGNAL_RULES = [
  { signal: 'comparison', test: /\b(vs|versus|difference|compare|advantages?\b.*disadvantages?|ডিফারেন্স)/i },
  { signal: 'process', test: /\b(process|flow|steps?|cycle|lifecycle|প্রক্রিয়া|ধাপ)/i },
  { signal: 'architecture', test: /\b(architecture|layers?|stack|block diagram|organization|organisation)/i },
  { signal: 'protocol', test: /\b(protocol|communication|messaging|handshake)/i },
  { signal: 'parts', test: /\b(components?|elements?|parts?|structure|classification)/i },
];

export function detectSignal(text) {
  for (const rule of SIGNAL_RULES) if (rule.test.test(text)) return rule.signal;
  return 'concept';
}

/** "Basic concepts" -> ["Basic", "concepts"] filtered down to meaningful words. */
export function extractKeywords(text, limit = 5) {
  return String(text ?? '')
    .split(/[,;/|\n•\-–—()]+|\s{2,}/)
    .flatMap((chunk) => chunk.split(/\s+/))
    .map((word) => word.replace(/[^\p{L}\p{N}+#/]/gu, '').trim())
    .filter((word) => word.length > 2 && !STOPWORDS.has(word.toLowerCase()))
    .filter((word, index, list) => list.findIndex((other) => other.toLowerCase() === word.toLowerCase()) === index)
    .slice(0, limit);
}

const uniqueCaseInsensitive = (values) => {
  const seen = new Set();
  const out = [];
  for (const value of values) {
    const key = String(value).trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(String(value).trim());
  }
  return out;
};

const joinList = (items, limit) => uniqueCaseInsensitive(items).slice(0, limit);

/** Builds the profile when nothing in the library matches the topic. */
function deriveProfile({ topicName, topicNameBn, description, chapterName, subjectName, signal }) {
  // What the student (or the seed data) already wrote about the topic is the
  // best material: a description like "Voltage, current, resistance" literally
  // is the list of parts to draw.
  const descriptionParts = String(description ?? '')
    .split(/[,;\n•]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 2 && part.length < 80);

  const parts =
    descriptionParts.length >= 2
      ? descriptionParts.slice(0, 5)
      : [
          `${topicName} itself as the central subject of the picture`,
          `the main parts of ${topicName}, labelled with the standard terminology used in ${subjectName}`,
          `how those parts work together or affect each other`,
        ];

  const cleanDescription = String(description ?? '').trim().replace(/[.\s]+$/, '');
  const context = chapterName ? ` It is studied in "${chapterName}"${subjectName ? ` (${subjectName})` : ''}.` : '';
  const concept = cleanDescription
    ? `${topicName} — ${cleanDescription}.${context}`
    : `${topicName}.${context} The illustration should make its main parts and how they fit together understandable at a glance.`;

  return {
    source: 'derived',
    matchedIds: [],
    concept,
    oneLine: cleanDescription ? `${topicName} — ${cleanDescription}` : topicName,
    components: parts,
    flow: parts.slice(0, 4).map((part) => `Step ${parts.indexOf(part) + 1}: ${part}`),
    relationships: [
      `Show how these points connect to each other, in the order they actually occur in ${topicName}`,
      `Label every part with the standard terminology of ${subjectName}`,
    ],
    // terminology hints: whole phrases, never single half-words of the topic name
    keywords: uniqueCaseInsensitive(
      [...descriptionParts, topicName, topicNameBn, ...extractKeywords(chapterName, 2)].filter(Boolean)
    ).slice(0, 6),
    signal,
  };
}

/**
 * @param {object} input
 * @param {string} input.subjectName
 * @param {string} [input.chapterName]
 * @param {number} [input.chapterNumber]
 * @param {string} input.topicName
 * @param {string} [input.topicNameBn]
 * @param {string} [input.description]
 * @returns {object} profile used by promptTemplates.js
 */
export function analyzeTopic({
  subjectName = '',
  chapterName = '',
  chapterNumber = null,
  topicName = '',
  topicNameBn = '',
  description = '',
} = {}) {
  const signal = detectSignal(`${topicName} ${chapterName}`);

  // Score in two levels. A match on the topic name (or its description) is
  // topic-level: those entries describe exactly this topic and all of them count
  // — "File System vs DBMS" matches both halves. A match that only came from the
  // subject title is just context (the subject "IoT & IoT Architecture" contains
  // the word "architecture"), so it is used only when the topic itself matched
  // nothing: otherwise an MQTT prompt would be diluted with layer diagrams.
  const subjectFamily = detectSubjectFamily(subjectName, chapterName);

  /**
   * May this concept be used for this topic?
   *  - same family            → yes
   *  - family 'general'       → yes (protocol basics, embedded systems …)
   *  - unknown subject family → yes (a custom subject still gets real content)
   *  - another family         → only when the topic's OWN name is unambiguous
   *                             (entry.strong), e.g. a "File System" topic
   *                             wherever it is taught
   */
  const matchesFamily = (entry, name) => {
    if (entry.family !== 'security' && entry.family !== 'dbms' && entry.family !== 'microcontroller'
        && entry.family !== 'network' && entry.family !== 'iot') return true;
    if (!entry.family || entry.family === 'general' || subjectFamily === 'unknown') return true;
    if (entry.family === subjectFamily) return true;
    return Boolean(entry.strong?.test(name));
  };
  const weightOf = (entry) => entry.weight ?? 1;

  const scored = CONCEPT_ENTRIES.filter((entry) => matchesFamily(entry, topicName)).map((entry) => ({
    entry,
    nameLevel: entry.match.test(topicName) ? 2 * weightOf(entry) : 0,
    descriptionLevel: entry.match.test(description ?? '') ? 1 * weightOf(entry) : 0,
    contextLevel:
      (entry.match.test(chapterName) ? 1 : 0) + (entry.match.test(subjectName) ? 0.5 : 0),
  }));

  // Selection order: the topic's own name first (most specific entry wins, so
  // "Interrupt vector table" picks the vector-table concept, not the general
  // interrupt one), then the description, then the chapter/subject context.
  const pickBest = (field) => {
    const best = scored.reduce((max, item) => Math.max(max, item[field]), 0);
    return best > 0 ? { best, entries: scored.filter((item) => item[field] === best).map((item) => item.entry) } : null;
  };
  const byName = pickBest('nameLevel');
  const byDescription = byName ? null : pickBest('descriptionLevel');
  const matched = byName?.entries?.length
    ? byName.entries
    : byDescription?.entries?.length
      ? byDescription.entries
      : scored
          .filter((item) => item.contextLevel > 0)
          .sort((a, b) => b.contextLevel - a.contextLevel)
          .slice(0, 1)
          .map((item) => item.entry);

  if (!matched.length) {
    return {
      ...deriveProfile({ topicName, topicNameBn, description, chapterName, subjectName, signal }),
      signal,
      subjectFamily,
    };
  }

  // Several entries at the same level are genuinely one topic: "File System vs
  // DBMS" matches both, and both halves belong in the picture.
  const concept = uniqueCaseInsensitive(matched.map((entry) => entry.concept)).join(' ');
  const components = joinList(matched.flatMap((entry) => entry.components), 6);
  const flow = joinList(matched.flatMap((entry) => entry.flow), 6);
  const relationships = joinList(matched.flatMap((entry) => entry.relationships), 5);

  const firstSentence = (text) => String(text).split(/(?<=\.)\s/)[0];

  return {
    source: 'library',
    matchedIds: matched.map((entry) => entry.id),
    concept,
    oneLine: firstSentence(concept),
    components,
    flow,
    relationships,
    keywords: joinList(matched.flatMap((entry) => entry.keywords), 6),
    signal,
    subjectFamily,
    topicNameBn: topicNameBn || null,
  };
}
