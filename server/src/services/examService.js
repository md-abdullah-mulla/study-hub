import { examRepo } from '../repositories/examRepo.js';
import { topicRepo } from '../repositories/topicRepo.js';
import { chapterRepo } from '../repositories/chapterRepo.js';
import { subjectRepo } from '../repositories/subjectRepo.js';
import { activityRepo } from '../repositories/activityRepo.js';
import { analyzeTopic } from './illustration/topicAnalyzer.js';
import { buildMcqItems } from './studyContent/contentTemplates.js';
import { badRequest, notFound } from '../utils/http.js';
import { nowIso } from '../utils/date.js';

/**
 * Exam Mode service (Phase 5).
 *
 * Rules that keep an exam honest:
 *  1. Questions come ONLY from the chosen subject → chapter → topic.
 *  2. Two sources: the student's own quiz bank (mcq / true-false) and, if the
 *     bank does not have enough questions, the pattern-based MCQs the study
 *     content generator already produces for that topic. Every question says
 *     which source it came from, so nothing is hidden.
 *  3. The correct answers stay on the server until the exam is submitted
 *     (`questions_json` snapshot, stripped by `publicQuestions`).
 *  4. Scoring is counting: correct / wrong / unanswered, percentage from the
 *     real totals — never a made-up number.
 */

const MAX_QUESTIONS = 50;
const MIN_QUESTIONS = 1;

const shuffle = (items) => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const normalize = (value) => String(value ?? '').trim().toLowerCase().replace(/\s+/g, ' ');

/** Resolves the scope (subject/chapter/topic) and every topic inside it. */
function resolveScope(userId, { subjectId, chapterId, topicId } = {}) {
  if (topicId) {
    const topic = topicRepo.findById(topicId);
    if (!topic) throw notFound('Topic not found');
    const chapter = chapterRepo.findById(topic.chapterId);
    const subject = subjectRepo.findById(chapter?.subjectId);
    if (!subject || subject.userId !== userId) throw notFound('Topic not found');
    return {
      subject,
      chapter,
      topic,
      topics: [topic],
      label: `${subject.name} → Ch ${chapter.number}: ${chapter.name} → ${topic.name}`,
    };
  }

  if (chapterId) {
    const chapter = chapterRepo.findById(chapterId);
    if (!chapter) throw notFound('Chapter not found');
    const subject = subjectRepo.findById(chapter.subjectId);
    if (!subject || subject.userId !== userId) throw notFound('Chapter not found');
    return {
      subject,
      chapter,
      topic: null,
      topics: topicRepo.listByChapter(chapter.id),
      label: `${subject.name} → Ch ${chapter.number}: ${chapter.name}`,
    };
  }

  if (subjectId) {
    const subject = subjectRepo.findById(subjectId);
    if (!subject || subject.userId !== userId) throw notFound('Subject not found');
    const chapters = chapterRepo.listBySubject(subject.id);
    return {
      subject,
      chapter: null,
      topic: null,
      topics: chapters.flatMap((chapter) => topicRepo.listByChapter(chapter.id)),
      label: subject.name,
    };
  }

  // whole semester
  const subjects = subjectRepo.listByUser(userId);
  return {
    subject: null,
    chapter: null,
    topic: null,
    topics: subjects.flatMap((subject) =>
      chapterRepo.listBySubject(subject.id).flatMap((chapter) => topicRepo.listByChapter(chapter.id))
    ),
    label: 'সব subject (Semester 6)',
  };
}

/** Pattern-based MCQs for the topics in scope (no AI API involved). */
function generatedQuestions(scope) {
  const items = [];
  for (const topic of scope.topics) {
    const chapter = chapterRepo.findById(topic.chapterId);
    const subject = chapter ? subjectRepo.findById(chapter.subjectId) : null;
    const profile = analyzeTopic({
      subjectName: subject?.name ?? '',
      chapterName: chapter?.name ?? '',
      chapterNumber: chapter?.number ?? null,
      topicName: topic.name,
      topicNameBn: topic.nameBn ?? '',
      description: topic.description ?? '',
    });
    const mcqs = buildMcqItems({ profile, topic });
    mcqs.forEach((mcq, index) => {
      if (!mcq.options?.length || !mcq.answer) return;
      items.push({
        id: `gen:${topic.id}:${index}`,
        type: 'mcq',
        question: mcq.question,
        options: shuffle(mcq.options),
        answer: mcq.answer,
        topicId: topic.id,
        topicName: topic.name,
        source: 'generated',
      });
    });
  }
  return items;
}

function bankItems(userId, scope) {
  return examRepo
    .bankQuestions(userId, {
      subjectId: scope.subject?.id,
      chapterId: scope.chapter?.id,
      topicId: scope.topic?.id,
    })
    .map((row) => {
      const parsed = row.optionsJson ? JSON.parse(row.optionsJson) : null;
      const options =
        Array.isArray(parsed) && parsed.length
          ? parsed
          : row.type === 'true_false'
            ? ['সত্য', 'মিথ্যা']
            : null;
      if (!options || options.length < 2) return null;
      return {
        id: `bank:${row.id}`,
        type: row.type,
        question: row.question,
        options: shuffle(options),
        answer: row.correctAnswer,
        topicId: row.topicId,
        topicName: row.topicName ?? null,
        source: 'bank',
      };
    })
    .filter(Boolean);
}

/** How many questions of each kind are available for a scope (used by the UI). */
export function examAvailability(userId, scopeInput = {}) {
  const scope = resolveScope(userId, scopeInput);
  const bank = bankItems(userId, scope);
  const generated = generatedQuestions(scope);
  return {
    scopeLabel: scope.label,
    bank: bank.length,
    generated: generated.length,
    total: bank.length + generated.length,
    topicsInScope: scope.topics.length,
  };
}

export function createExam(userId, body = {}) {
  const scope = resolveScope(userId, {
    subjectId: body.subjectId ? Number(body.subjectId) : undefined,
    chapterId: body.chapterId ? Number(body.chapterId) : undefined,
    topicId: body.topicId ? Number(body.topicId) : undefined,
  });

  const requested = Number(body.questionCount ?? 10);
  if (!Number.isInteger(requested) || requested < MIN_QUESTIONS || requested > MAX_QUESTIONS) {
    throw badRequest(`questionCount must be a whole number between ${MIN_QUESTIONS} and ${MAX_QUESTIONS}`);
  }
  const duration = Number(body.durationMinutes ?? Math.max(10, Math.round(requested * 1.5)));
  if (!Number.isInteger(duration) || duration < 1 || duration > 300) {
    throw badRequest('durationMinutes must be a whole number between 1 and 300');
  }

  // Prefer the student's own question bank, then fill up with pattern-based MCQs.
  const bank = shuffle(bankItems(userId, scope));
  const generated = shuffle(generatedQuestions(scope));
  const picked = [...bank, ...generated].slice(0, requested);

  if (!picked.length) {
    throw badRequest(
      'এই scope-এ কোনো প্রশ্ন নেই। আগে Quiz পেজে এই subject/chapter-এর প্রশ্ন যোগ করো, অথবা অন্য scope বেছে নাও।'
    );
  }

  const startedAt = nowIso();
  const exam = examRepo.create({
    userId,
    subjectId: scope.subject?.id ?? null,
    chapterId: scope.chapter?.id ?? null,
    topicId: scope.topic?.id ?? null,
    scopeLabel: scope.label,
    title: `${body.title?.trim() || 'Exam'} — ${scope.label}`,
    questionCount: picked.length,
    durationMinutes: duration,
    questions: picked,
    startedAt,
  });

  activityRepo.record({
    userId,
    type: 'exam_started',
    message: `Exam শুরু হলো: ${scope.label} (${picked.length}টা প্রশ্ন)`,
  });

  return {
    ...publicExam(exam),
    requestedCount: requested,
    counts: { bank: picked.filter((q) => q.source === 'bank').length, generated: picked.filter((q) => q.source === 'generated').length },
    available: { bank: bank.length, generated: generated.length, total: bank.length + generated.length },
  };
}

/** The exam without any correct answer — what the browser may see before submitting. */
function publicExam(exam) {
  const questions = JSON.parse(exam.questionsJson);
  return {
    id: exam.id,
    title: exam.title,
    scopeLabel: exam.scopeLabel,
    subjectId: exam.subjectId,
    chapterId: exam.chapterId,
    topicId: exam.topicId,
    questionCount: exam.questionCount,
    durationMinutes: exam.durationMinutes,
    status: exam.status,
    startedAt: exam.startedAt,
    submittedAt: exam.submittedAt,
    questions: exam.status === 'submitted' ? questions.map(stripAnswer) : questions.map(stripAnswer),
    summary:
      exam.status === 'submitted'
        ? {
            total: exam.total,
            correct: exam.correct,
            wrong: exam.wrong,
            unanswered: exam.unanswered,
            score: exam.score,
            percentage: exam.percentage,
            timeTakenSeconds: exam.timeTakenSeconds,
          }
        : null,
  };
}

const stripAnswer = (question) => ({
  id: question.id,
  type: question.type,
  question: question.question,
  options: question.options,
  topicId: question.topicId ?? null,
  topicName: question.topicName ?? null,
  source: question.source,
});

export function getExam(userId, examId, { includeAnswers = false } = {}) {
  const exam = examRepo.findById(examId);
  if (!exam || exam.userId !== userId) throw notFound('Exam not found');

  const questions = JSON.parse(exam.questionsJson);
  const answers = exam.answersJson ? JSON.parse(exam.answersJson) : {};
  const revealAnswers = includeAnswers || exam.status === 'submitted';

  return {
    ...publicExam(exam),
    questions: questions.map((question) => ({
      ...(revealAnswers ? question : stripAnswer(question)),
      yourAnswer: answers[question.id] ?? null,
      ...(revealAnswers
        ? {
            isCorrect: normalize(answers[question.id]) === normalize(question.answer),
            status:
              answers[question.id] === undefined || answers[question.id] === null || answers[question.id] === ''
                ? 'unanswered'
                : normalize(answers[question.id]) === normalize(question.answer)
                  ? 'correct'
                  : 'wrong',
          }
        : {}),
    })),
  };
}

export function submitExam(userId, examId, { answers = {}, timeTakenSeconds } = {}) {
  const exam = examRepo.findById(examId);
  if (!exam || exam.userId !== userId) throw notFound('Exam not found');
  if (exam.status === 'submitted') throw badRequest('এই exam আগেই জমা দেওয়া হয়েছে');

  const questions = JSON.parse(exam.questionsJson);
  const cleaned = {};
  for (const question of questions) {
    const value = answers[question.id];
    cleaned[question.id] = value === undefined || value === null ? '' : String(value);
  }

  let correct = 0;
  let wrong = 0;
  let unanswered = 0;
  const weakTopics = new Set();

  for (const question of questions) {
    const given = cleaned[question.id];
    if (given === '') {
      unanswered += 1;
      continue;
    }
    if (normalize(given) === normalize(question.answer)) {
      correct += 1;
    } else {
      wrong += 1;
      if (question.topicId) weakTopics.add(question.topicId);
    }
  }

  const total = questions.length;
  const percentage = total ? Math.round((correct / total) * 100) : 0;
  const startedMs = new Date(exam.startedAt).getTime();
  const elapsed = Math.max(0, Math.round((Date.now() - startedMs) / 1000));
  // "Time Taken" is measured on the server from started_at, so a student cannot
  // report a nicer time than they actually took. `timeTakenSeconds` is accepted
  // for compatibility but only used when the server has no start time.
  const reported = Number(timeTakenSeconds);
  const taken = exam.startedAt ? elapsed : (Number.isFinite(reported) ? Math.max(0, Math.round(reported)) : 0);

  examRepo.update(examId, {
    status: 'submitted',
    answersJson: JSON.stringify(cleaned),
    submittedAt: nowIso(),
    total,
    correct,
    wrong,
    unanswered,
    score: correct,
    percentage,
    timeTakenSeconds: taken,
    weakTopicIdsJson: JSON.stringify([...weakTopics]),
  });

  activityRepo.record({
    userId,
    type: 'exam_submitted',
    message: `Exam জমা হলো: ${exam.scopeLabel} — ${correct}/${total} (${percentage}%)`,
  });

  return getExam(userId, examId, { includeAnswers: true });
}

export function listExams(userId, limit = 25) {
  return examRepo.listByUser(userId, Math.min(100, Math.max(1, Number(limit) || 25))).map((exam) => ({
    ...publicExam(exam),
    subjectName: exam.subjectName,
    chapterName: exam.chapterName,
    topicName: exam.topicName,
    weakTopicIds: exam.weakTopicIdsJson ? JSON.parse(exam.weakTopicIdsJson) : [],
  }));
}

export function deleteExam(userId, examId) {
  const exam = examRepo.findById(examId);
  if (!exam || exam.userId !== userId) throw notFound('Exam not found');
  return examRepo.remove(examId);
}

/** Exam analytics: real numbers from submitted exams only. */
export function examStats(userId) {
  const submitted = examRepo.listSubmitted(userId);
  const percentages = submitted.map((exam) => exam.percentage);
  const bySubject = new Map();

  for (const exam of submitted) {
    const key = exam.subjectId ?? 0;
    const entry = bySubject.get(key) ?? { subjectId: key, attempts: 0, totalPercentage: 0, best: 0 };
    entry.attempts += 1;
    entry.totalPercentage += exam.percentage;
    entry.best = Math.max(entry.best, exam.percentage);
    bySubject.set(key, entry);
  }

  const subjects = [...bySubject.values()].map((entry) => {
    const subject = entry.subjectId ? subjectRepo.findById(entry.subjectId) : null;
    return {
      subjectId: entry.subjectId || null,
      subjectName: subject?.name ?? 'সব subject',
      attempts: entry.attempts,
      averagePercentage: Math.round(entry.totalPercentage / entry.attempts),
      best: entry.best,
    };
  });

  const weakTopicIds = new Set();
  for (const exam of submitted) {
    if (!exam.weakTopicIdsJson) continue;
    for (const id of JSON.parse(exam.weakTopicIdsJson)) weakTopicIds.add(id);
  }

  return {
    totalExams: submitted.length,
    averagePercentage: percentages.length ? Math.round(percentages.reduce((sum, p) => sum + p, 0) / percentages.length) : 0,
    best: percentages.length ? Math.max(...percentages) : 0,
    lowest: percentages.length ? Math.min(...percentages) : 0,
    lastPercentage: percentages.length ? percentages[0] : null,
    trend: submitted
      .slice(0, 10)
      .reverse()
      .map((exam) => ({ examId: exam.id, percentage: exam.percentage, takenAt: exam.submittedAt ?? exam.startedAt })),
    bySubject: subjects,
    weakTopicIds: [...weakTopicIds],
    totalQuestionsAnswered: submitted.reduce((sum, exam) => sum + exam.total, 0),
    totalCorrect: submitted.reduce((sum, exam) => sum + exam.correct, 0),
    totalWrong: submitted.reduce((sum, exam) => sum + exam.wrong, 0),
    totalUnanswered: submitted.reduce((sum, exam) => sum + exam.unanswered, 0),
  };
}
