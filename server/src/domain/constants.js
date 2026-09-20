export const TOPIC_STATUSES = ['not_started', 'studying', 'completed', 'needs_revision'];
export const REVISION_STAGES = ['none', 'learned', 'revision_1', 'revision_2', 'final'];
export const IMPORTANCE = ['low', 'medium', 'high'];

export const QUIZ_QUESTION_TYPES = ['mcq', 'true_false', 'short', 'viva'];

export const QUIZ_TYPE_LABELS_BN = {
  mcq: 'MCQ (বহুনির্বাচনী)',
  true_false: 'সত্য / মিথ্যা',
  short: 'সংক্ষিপ্ত প্রশ্ন',
  viva: 'Viva / মৌখিক',
};

/** MCQs are graded by the computer; written answers are graded by the student. */
export const AUTO_GRADED_TYPES = ['mcq', 'true_false'];

/** A topic counts as weak below this accuracy (only with real answered questions). */
export const WEAK_TOPIC_THRESHOLD = 60;

export const SELF_SCORE_OPTIONS = [1, 0.5, 0];

export const STATUS_LABELS_BN = {
  not_started: 'শুরু করিনি',
  studying: 'চলছে',
  completed: 'শেষ',
  needs_revision: 'রিভিশন দরকার',
};
