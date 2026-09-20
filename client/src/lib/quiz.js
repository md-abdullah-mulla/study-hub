/**
 * Quiz presentation helpers (Phase 3).
 *
 * The API deliberately keeps two views apart: taking a quiz gets no answers,
 * the editor and the review get everything. These helpers turn whatever the
 * API returns into one shape the screens can rely on — one place instead of
 * several slightly different ones.
 */
export const QUESTION_TYPES = [
  { value: 'mcq', label: 'MCQ (বহুনির্বাচনী)' },
  { value: 'true_false', label: 'সত্য / মিথ্যা' },
  { value: 'short', label: 'সংক্ষিপ্ত প্রশ্ন' },
  { value: 'viva', label: 'Viva / মৌখিক' },
];

export const QUESTION_TYPE_LABELS = {
  mcq: 'MCQ',
  true_false: 'সত্য/মিথ্যা',
  short: 'সংক্ষিপ্ত',
  viva: 'Viva',
};

/** Graded by comparing with the stored answer — never by hand. */
export const AUTO_GRADED_TYPES = ['mcq', 'true_false'];

export const isAutoGraded = (type) => AUTO_GRADED_TYPES.includes(type);

/**
 * The response of POST /api/quizzes/:id/attempt, flattened into one attempt
 * object: the review rows get their type label + who grades them, so the
 * review screen never has to guess (an MCQ must not offer "mark it yourself").
 */
export function normalizeAttempt(outcome) {
  const result = outcome.result ?? outcome;
  return {
    ...result,
    review: (outcome.review ?? []).map((row) => ({
      ...row,
      typeLabel: row.typeLabel ?? QUESTION_TYPE_LABELS[row.type] ?? row.type,
      autoGraded: row.autoGraded ?? isAutoGraded(row.type),
    })),
    weakTopics: result.weakTopics ?? outcome.weakTopics ?? [],
  };
}
