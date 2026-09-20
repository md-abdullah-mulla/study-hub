import { quizRepo } from '../repositories/quizRepo.js';
import { quizQuestionRepo } from '../repositories/quizQuestionRepo.js';
import { quizResultRepo } from '../repositories/quizResultRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import {
  QUIZ_QUESTION_TYPES,
  QUIZ_TYPE_LABELS_BN,
  AUTO_GRADED_TYPES,
  WEAK_TOPIC_THRESHOLD,
  SELF_SCORE_OPTIONS,
} from '../domain/constants.js';
import { badRequest, notFound } from '../utils/http.js';

/**
 * Quiz system (Phase 3).
 *
 * Honesty rules baked into this service:
 *  - MCQs and True/False are graded by comparing the answer with the stored one.
 *  - Short/Viva answers are written text: the app never guesses a score for
 *    them. They start as "not marked yet" (0 points until the student marks
 *    them), and the student can mark each one later.
 *  - A topic is called *weak* only from real answered questions; simply being
 *    unfinished is not "weak".
 */

const TRUE_FALSE_OPTIONS = ['সত্য', 'মিথ্যা'];

const normalize = (value) =>
  String(value ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase();

const accuracyOf = (awarded, total) => (total ? Math.round((awarded / total) * 100) : 0);

/** Written answers are only ever marked by the student, with fixed steps. */
const parseSelfScore = (value) => {
  if (value === undefined || value === null || value === '') return null;
  const score = Number(value);
  if (!SELF_SCORE_OPTIONS.includes(score)) {
    throw badRequest('নিজের মার্ক 1 (সঠিক), 0.5 (আংশিক) বা 0 (ভুল) হতে হবে');
  }
  return score;
};

const findOwnedQuiz = (userId, quizId) => {
  const quiz = quizRepo.findById(quizId);
  if (!quiz || quiz.userId !== userId) throw notFound('Quiz not found');
  return quiz;
};

const findOwnedResult = (userId, resultId) => {
  const result = quizResultRepo.findById(resultId);
  if (!result || result.userId !== userId) throw notFound('Quiz result not found');
  return result;
};

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------
export function listQuizzes(userId) {
  return {
    quizzes: quizRepo.listByUser(userId),
    summary: quizSummary(userId),
  };
}

export function createQuiz(userId, body = {}) {
  const chapterId = Number(body.chapterId);
  if (!Number.isInteger(chapterId) || chapterId <= 0) throw badRequest('chapterId is required');
  const chapter = chapterRepo.findById(chapterId);
  if (!chapter) throw notFound('Chapter not found');
  const subject = subjectRepo.findById(chapter.subjectId);
  if (!subject || subject.userId !== userId) throw notFound('Chapter not found');

  const title = String(body.title ?? '').trim();
  if (!title) throw badRequest('Missing required field(s): title');

  const quiz = quizRepo.create({ userId, chapterId, title, createdBy: 'user' });
  activityRepo.record({
    userId,
    type: 'quiz_created',
    subjectId: subject.id,
    chapterId,
    message: `Quiz তৈরি হলো: "${title}" (${subject.name} → Ch ${chapter.number})`,
  });
  return quiz;
}

/**
 * Questions are returned WITHOUT the answers by default, so a quiz can be taken
 * honestly in the same window. The editor asks for them explicitly
 * (`GET /api/quizzes/:id?answers=1`) — that is the teacher view.
 */
export function getQuiz(userId, quizId, { includeAnswers = false } = {}) {
  const quiz = findOwnedQuiz(userId, quizId);
  return {
    ...quiz,
    questions: quizQuestionRepo.listByQuiz(quizId, { includeAnswers }),
    results: quizResultRepo.listByQuiz(quizId).slice(0, 5),
  };
}

export function updateQuiz(userId, quizId, body = {}) {
  findOwnedQuiz(userId, quizId);
  const patch = {};
  if (body.title !== undefined) {
    const title = String(body.title).trim();
    if (!title) throw badRequest('title cannot be empty');
    patch.title = title;
  }
  if (body.chapterId !== undefined) {
    const chapterId = Number(body.chapterId);
    const chapter = chapterRepo.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found');
    patch.chapterId = chapterId;
  }
  return quizRepo.update(quizId, patch);
}

export function deleteQuiz(userId, quizId) {
  findOwnedQuiz(userId, quizId);
  return quizRepo.remove(quizId);
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------
const cleanOptions = (type, options) => {
  if (type === 'mcq') {
    const cleaned = (Array.isArray(options) ? options : [])
      .map((option) => String(option ?? '').trim())
      .filter(Boolean);
    if (cleaned.length < 2) throw badRequest('MCQ-তে অন্তত ২টা option লাগবে');
    return cleaned;
  }
  if (type === 'true_false') return TRUE_FALSE_OPTIONS;
  return [];
};

const cleanQuestion = (body, existing = null) => {
  const type = body.type ?? existing?.type;
  if (!QUIZ_QUESTION_TYPES.includes(type)) {
    throw badRequest(`type must be one of: ${QUIZ_QUESTION_TYPES.join(', ')}`);
  }
  const question = String(body.question ?? existing?.question ?? '').trim();
  if (!question) throw badRequest('Missing required field(s): question');

  const options = cleanOptions(
    type,
    body.options !== undefined ? body.options : existing?.options
  );

  const correctAnswer =
    body.correctAnswer !== undefined
      ? String(body.correctAnswer).trim() || null
      : (existing?.correctAnswer ?? null);

  if (type === 'mcq') {
    if (!correctAnswer) throw badRequest('MCQ-এর সঠিক উত্তর দিতে হবে');
    if (!options.some((option) => normalize(option) === normalize(correctAnswer))) {
      throw badRequest('সঠিক উত্তরটা option-গুলোর মধ্যে একটাই হতে হবে');
    }
  }
  if (type === 'true_false' && !TRUE_FALSE_OPTIONS.some((option) => normalize(option) === normalize(correctAnswer))) {
    throw badRequest('সত্য/মিথ্যা প্রশ্নের উত্তর "সত্য" বা "মিথ্যা" হতে হবে');
  }

  return {
    type,
    question,
    options,
    correctAnswer,
    explanation: body.explanation !== undefined ? String(body.explanation).trim() || null : (existing?.explanation ?? null),
    topicId: body.topicId === undefined ? (existing?.topicId ?? null) : (body.topicId === null ? null : Number(body.topicId)),
  };
};

export function addQuestion(userId, quizId, body = {}) {
  const quiz = findOwnedQuiz(userId, quizId);
  const data = cleanQuestion(body);

  // A question may only point at a topic of its own chapter — otherwise the
  // weak-topic report would blame a topic the quiz never covered.
  if (data.topicId !== null) {
    const topic = topicRepo.findById(data.topicId);
    if (!topic) throw notFound('Topic not found');
    if (topic.chapterId !== quiz.chapterId) {
      throw badRequest('প্রশ্নের topic-টা এই chapter-এর ভেতরের হতে হবে');
    }
  }

  return quizQuestionRepo.create({ ...data, quizId });
}

export function updateQuestion(userId, quizId, questionId, body = {}) {
  const quiz = findOwnedQuiz(userId, quizId);
  const existing = quizQuestionRepo.findById(questionId);
  if (!existing || existing.quizId !== quiz.id) throw notFound('Question not found');
  const data = cleanQuestion(body, existing);
  return quizQuestionRepo.update(questionId, data);
}

export function deleteQuestion(userId, quizId, questionId) {
  const quiz = findOwnedQuiz(userId, quizId);
  const existing = quizQuestionRepo.findById(questionId);
  if (!existing || existing.quizId !== quiz.id) throw notFound('Question not found');
  return quizQuestionRepo.remove(questionId);
}

// ---------------------------------------------------------------------------
// Taking a quiz
// ---------------------------------------------------------------------------
const gradeAnswers = (questions, submitted, { keepSelf = false, existingAnswers = [] } = {}) => {
  const byQuestion = new Map(submitted.map((entry) => [Number(entry.questionId), entry]));
  const previous = new Map(existingAnswers.map((entry) => [entry.questionId, entry]));

  return questions.map((question) => {
    const entry = byQuestion.get(question.id) ?? {};
    const earlier = previous.get(question.id);
    const auto = AUTO_GRADED_TYPES.includes(question.type);

    let awarded = 0;
    let isCorrect = false;
    let selfGraded = false;
    let answer = entry.answer !== undefined ? entry.answer : (earlier?.answer ?? null);

    if (auto) {
      isCorrect = Boolean(answer) && normalize(answer) === normalize(question.correctAnswer);
      awarded = isCorrect ? 1 : 0;
    } else {
      const selfScore = parseSelfScore(entry.selfScore);
      const kept = keepSelf ? (earlier?.awarded ?? 0) : null;
      const value = selfScore ?? kept ?? 0;
      awarded = value;
      isCorrect = value === 1;
      selfGraded = selfScore !== null || (keepSelf && earlier?.selfGraded === true);
    }

    return {
      questionId: question.id,
      topicId: question.topicId ?? null,
      answer: answer === undefined ? null : answer,
      isCorrect,
      awarded,
      maxPoints: 1,
      selfGraded,
      // extra info for the review screen only
      type: question.type,
      question: question.question,
      options: question.options,
      correctAnswer: question.correctAnswer,
      explanation: question.explanation,
    };
  });
};

/** Groups the attempt's answers per topic -> accuracy + weak flag. */
const topicBreakdown = (graded, questionsById) => {
  const topics = new Map();
  for (const answer of graded) {
    if (!answer.topicId) continue;
    const entry = topics.get(answer.topicId) ?? { topicId: answer.topicId, awarded: 0, maxPoints: 0, answered: 0 };
    entry.awarded += answer.awarded;
    entry.maxPoints += answer.maxPoints;
    entry.answered += 1;
    topics.set(answer.topicId, entry);
  }
  return [...topics.values()]
    .map((entry) => {
      const topic = questionsById.get(entry.topicId) ?? {};
      const accuracy = accuracyOf(entry.awarded, entry.maxPoints);
      return {
        ...entry,
        accuracy,
        weak: accuracy < WEAK_TOPIC_THRESHOLD,
        name: topic.name ?? null,
      };
    })
    .sort((a, b) => a.accuracy - b.accuracy);
};

/** Reads the stored answers of a result and refreshes its totals + weak topics. */
function recomputeResult(resultId) {
  const result = quizResultRepo.findById(resultId);
  const answers = quizResultRepo.listAnswers(resultId);
  const score = answers.reduce((sum, entry) => sum + entry.awarded, 0);
  const total = answers.reduce((sum, entry) => sum + entry.maxPoints, 0);
  const weakTopics = weakTopicsFromAnswers(answers);

  return quizResultRepo.updateTotals(resultId, {
    score,
    total,
    accuracy: accuracyOf(score, total),
    weakTopics,
  }) ?? result;
}

function weakTopicsFromAnswers(answers) {
  const perTopic = new Map();
  for (const answer of answers) {
    if (!answer.topicId) continue;
    const entry = perTopic.get(answer.topicId) ?? { topicId: answer.topicId, awarded: 0, maxPoints: 0, answered: 0 };
    entry.awarded += answer.awarded;
    entry.maxPoints += answer.maxPoints;
    entry.answered += 1;
    perTopic.set(answer.topicId, entry);
  }

  return [...perTopic.values()]
    .filter((entry) => entry.maxPoints > 0)
    .map((entry) => {
      const topic = topicRepo.findById(entry.topicId);
      const accuracy = accuracyOf(entry.awarded, entry.maxPoints);
      return {
        topicId: entry.topicId,
        topicName: topic?.name ?? null,
        accuracy,
        answered: entry.answered,
      };
    })
    .filter((entry) => entry.accuracy < WEAK_TOPIC_THRESHOLD)
    .sort((a, b) => a.accuracy - b.accuracy);
}

export function attemptQuiz(userId, quizId, body = {}) {
  const quiz = findOwnedQuiz(userId, quizId);
  const questions = quizQuestionRepo.listByQuiz(quizId, { includeAnswers: true });
  if (!questions.length) throw badRequest('এই quiz-এ কোনো প্রশ্ন নেই — আগে প্রশ্ন যোগ করো');

  const submitted = Array.isArray(body.answers) ? body.answers : [];
  const graded = gradeAnswers(questions, submitted);

  const score = graded.reduce((sum, entry) => sum + entry.awarded, 0);
  const total = graded.reduce((sum, entry) => sum + entry.maxPoints, 0);

  const result = quizResultRepo.create({
    quizId,
    userId,
    score,
    total,
    accuracy: accuracyOf(score, total),
    weakTopics: [],
  });
  quizResultRepo.createAnswers(result.id, graded);

  const stored = recomputeResult(result.id) ?? result;

  // topics needed for the per-topic breakdown of THIS attempt
  const questionsById = new Map(questions.map((question) => [question.id, question]));
  const topicNames = new Map();
  for (const question of questions) {
    if (question.topicId && !topicNames.has(question.topicId)) {
      const topic = topicRepo.findById(question.topicId);
      if (topic) topicNames.set(topic.id, { name: topic.name, nameBn: topic.nameBn });
    }
  }
  const topics = topicBreakdown(graded, topicNames).map((entry) => ({
    ...entry,
    name: topicNames.get(entry.topicId)?.name ?? null,
    nameBn: topicNames.get(entry.topicId)?.nameBn ?? null,
  }));

  const unmarked = graded.filter((entry) => !AUTO_GRADED_TYPES.includes(entry.type) && !entry.selfGraded);

  activityRepo.record({
    userId,
    type: 'quiz_attempted',
    subjectId: quiz.subjectId,
    chapterId: quiz.chapterId,
    message: `Quiz দেওয়া হলো: "${quiz.title}" — ${stored.score}/${stored.total} (${stored.accuracy}%)`,
    meta: { quizId, resultId: stored.id, accuracy: stored.accuracy },
  });

  return {
    result: stored,
    review: graded.map(({ topicId, ...entry }) => ({ ...entry, topicId })),
    topics,
    weakTopics: stored.weakTopics,
    unmarkedQuestionIds: unmarked.map((entry) => entry.questionId),
    typeLabels: QUIZ_TYPE_LABELS_BN,
  };
}

/** Review screen for one attempt, including the right answers. */
export function getResult(userId, resultId) {
  const result = findOwnedResult(userId, resultId);
  const quiz = quizRepo.findById(result.quizId);
  const answers = quizResultRepo.listAnswers(resultId);
  const questions = new Map(
    quizQuestionRepo.listByQuiz(result.quizId, { includeAnswers: true }).map((question) => [question.id, question])
  );

  return {
    ...result,
    quizTitle: quiz?.title ?? null,
    chapterId: quiz?.chapterId ?? null,
    subjectName: quiz?.subjectName ?? null,
    review: answers.map((answer) => {
      const question = questions.get(answer.questionId) ?? {};
      return {
        questionId: answer.questionId,
        type: question.type ?? null,
        typeLabel: QUIZ_TYPE_LABELS_BN[question.type] ?? null,
        question: question.question ?? null,
        options: question.options ?? [],
        correctAnswer: question.correctAnswer ?? null,
        explanation: question.explanation ?? null,
        yourAnswer: answer.answer,
        awarded: answer.awarded,
        isCorrect: answer.isCorrect,
        selfGraded: answer.selfGraded,
        autoGraded: AUTO_GRADED_TYPES.includes(question.type),
        topicId: answer.topicId,
      };
    }),
    unmarkedQuestionIds: answers
      .filter((answer) => !answer.selfGraded && !AUTO_GRADED_TYPES.includes(questions.get(answer.questionId)?.type))
      .map((answer) => answer.questionId),
  };
}

/**
 * Marks written answers after the attempt (short/viva only) and refreshes the
 * totals — this is the student's own judgement, so it is stored as such.
 */
export function selfMarkResult(userId, resultId, body = {}) {
  const result = findOwnedResult(userId, resultId);
  const marks = Array.isArray(body.marks) ? body.marks : [];
  if (!marks.length) throw badRequest('marks array is required');

  for (const mark of marks) {
    const questionId = Number(mark.questionId);
    const question = quizQuestionRepo.findById(questionId);
    if (!question) throw notFound('Question not found');
    if (AUTO_GRADED_TYPES.includes(question.type)) {
      throw badRequest('MCQ আর True/False নিজে থেকেই যাচাই হয় — ওগুলো হাতে মার্ক করা যায় না');
    }
    const answer = quizResultRepo.findAnswer(resultId, questionId);
    if (!answer) throw notFound('This question was not part of the attempt');

    const score = parseSelfScore(mark.selfScore) ?? 0;
    quizResultRepo.updateAnswerSelfScore(resultId, questionId, {
      awarded: score,
      isCorrect: score === 1,
    });
  }

  const updated = recomputeResult(resultId);
  return { ...getResult(userId, resultId), result: updated };
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
/** Topics the student provably struggles with (measured, not guessed). */
export function weakTopics(userId) {
  return quizResultRepo
    .topicAccuracy(userId)
    .filter((row) => row.accuracy < WEAK_TOPIC_THRESHOLD)
    .map((row) => ({ ...row, suggestRevision: row.topicStatus !== 'needs_revision' }));
}

export function quizSummary(userId) {
  const summary = quizResultRepo.summary(userId);
  const topics = quizResultRepo.topicAccuracy(userId);
  return {
    ...summary,
    topicsPractised: topics.length,
    weakTopicCount: topics.filter((row) => row.accuracy < WEAK_TOPIC_THRESHOLD).length,
    topicAccuracy: topics,
    weakTopics: topics
      .filter((row) => row.accuracy < WEAK_TOPIC_THRESHOLD)
      .map((row) => ({ ...row, suggestRevision: row.topicStatus !== 'needs_revision' })),
    threshold: WEAK_TOPIC_THRESHOLD,
    typeLabels: QUIZ_TYPE_LABELS_BN,
  };
}

export function listResults(userId, limit = 20) {
  return {
    results: quizResultRepo.listByUser(userId, Math.min(100, Math.max(1, Number(limit) || 20))),
    summary: quizSummary(userId),
  };
}
