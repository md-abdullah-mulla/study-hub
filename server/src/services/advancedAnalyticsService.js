import { db } from '../db/connection.js';
import { camelAll } from '../utils/rows.js';
import { buildProgressTree } from './progressService.js';
import { buildStudyStats } from './statsService.js';
import { examStats } from './examService.js';
import { todayLocalDate } from '../utils/date.js';

/**
 * ADVANCED ANALYTICS (Phase 5).
 *
 * One rule: every number here is *measured*. Progress comes from topic status,
 * study time from the timer's sessions, accuracy from really answered quiz and
 * exam questions. Nothing is estimated, and a topic with no answered question is
 * never called "weak" — it simply has no data.
 *
 * The service also writes short Bangla insights ("Microcontroller-এ ভালো, কিন্তু
 * Interrupts chapter-এ accuracy কম") that the dashboard and the analytics page
 * show, so the student gets something to act on instead of bare numbers.
 */
const WEAK_ACCURACY = 60;
const MIN_ANSWERS_FOR_VERDICT = 3;
const BN_MONTHS = ['জানু', 'ফেব্রু', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্ট', 'অক্টো', 'নভে', 'ডিসে'];
const WEEKDAY_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

const shiftDay = (dateStr, delta) => {
  const date = new Date(`${dateStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + delta);
  return date.toISOString().slice(0, 10);
};

const round = (value) => Math.round(value * 10) / 10;

/** Quiz + exam questions that really got an answer (auto-graded or self-marked). */
function answeredQuestions(userId) {
  const rows = db
    .prepare(
      `SELECT qa.topic_id AS topicId, qa.is_correct AS isCorrect, qa.awarded AS awarded, qa.max_points AS maxPoints,
              qr.taken_at AS takenAt, t.name AS topicName, c.name AS chapterName, c.number AS chapterNumber,
              s.id AS subjectId, s.name AS subjectName, s.color AS subjectColor
         FROM quiz_answers qa
         JOIN quiz_results qr ON qr.id = qa.result_id
         LEFT JOIN topics   t ON t.id = qa.topic_id
         LEFT JOIN chapters c ON c.id = t.chapter_id
         LEFT JOIN subjects s ON s.id = c.subject_id
        WHERE qr.user_id = ? AND qa.max_points > 0`
    )
    .all(userId);

  const examRows = camelAll(
    db
      .prepare(
        `SELECT id, subject_id, percentage, correct, wrong, unanswered, total, submitted_at, scope_label, weak_topic_ids_json
           FROM exams WHERE user_id = ? AND status = 'submitted' ORDER BY submitted_at`
      )
      .all(userId)
  );

  return {
    quiz: rows.map((row) => ({
      topicId: row.topicId,
      topicName: row.topicName,
      chapterName: row.chapterName,
      chapterNumber: row.chapterNumber,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      isCorrect: Boolean(row.isCorrect),
      awarded: row.awarded,
      maxPoints: row.maxPoints,
      takenAt: row.takenAt,
    })),
    exams: examRows,
  };
}

/** Groups answers into accuracy per subject/chapter/topic, keeping only real data. */
function accuracyGroups(answers) {
  const group = (keyFn, labelFn) => {
    const map = new Map();
    for (const answer of answers) {
      const key = keyFn(answer);
      if (key === null || key === undefined) continue;
      const entry = map.get(key) ?? { key, label: labelFn(answer), answered: 0, correct: 0, awarded: 0, maxPoints: 0 };
      entry.answered += 1;
      entry.correct += answer.isCorrect ? 1 : 0;
      entry.awarded += answer.awarded;
      entry.maxPoints += answer.maxPoints;
      map.set(key, entry);
    }
    return [...map.values()].map((entry) => ({
      ...entry,
      accuracy: entry.maxPoints ? Math.round((entry.awarded / entry.maxPoints) * 100) : 0,
      hasEnoughData: entry.answered >= MIN_ANSWERS_FOR_VERDICT,
    }));
  };

  return {
    bySubject: group((a) => a.subjectId, (a) => a.subjectName),
    byChapter: group(
      (a) => (a.subjectName && a.chapterName ? `${a.subjectName}|${a.chapterNumber}|${a.chapterName}` : null),
      (a) => `Ch ${a.chapterNumber}: ${a.chapterName}`,
    ),
    byTopic: group((a) => a.topicId, (a) => a.topicName),
  };
}

/** Topics completed / minutes studied per day, week and month (real history). */
function activityHistory(userId) {
  const rows = camelAll(
    db
      .prepare(
        `SELECT date(started_at) AS day, SUM(duration_minutes) AS minutes, COUNT(*) AS sessions,
                SUM(topics_completed) AS completed
           FROM study_sessions WHERE user_id = ? GROUP BY day ORDER BY day`
      )
      .all(userId)
  );

  const completionByDay = camelAll(
    db
      .prepare(
        `SELECT date(completed_at) AS day, COUNT(*) AS completed
           FROM topics t JOIN chapters c ON c.id = t.chapter_id JOIN subjects s ON s.id = c.subject_id
          WHERE s.user_id = ? AND t.completed_at IS NOT NULL GROUP BY day ORDER BY day`
      )
      .all(userId)
  );

  const minutesByDay = new Map(rows.map((row) => [row.day, row.minutes ?? 0]));
  const completedByDay = new Map(completionByDay.map((row) => [row.day, row.completed ?? 0]));
  const today = todayLocalDate();

  const daily = Array.from({ length: 14 }, (_, index) => {
    const day = shiftDay(today, index - 13);
    return {
      day,
      label: `${WEEKDAY_BN[new Date(`${day}T00:00:00Z`).getUTCDay()]} ${Number(day.slice(8, 10))}`,
      minutes: minutesByDay.get(day) ?? 0,
      completed: completedByDay.get(day) ?? 0,
      isToday: day === today,
    };
  });

  const weekly = Array.from({ length: 8 }, (_, index) => {
    const end = shiftDay(today, -7 * (7 - index) + 6);
    const start = shiftDay(end, -6);
    let minutes = 0;
    let completed = 0;
    for (let cursor = start; cursor <= end; cursor = shiftDay(cursor, 1)) {
      minutes += minutesByDay.get(cursor) ?? 0;
      completed += completedByDay.get(cursor) ?? 0;
    }
    return { start, end, label: `${Number(start.slice(8, 10))}/${Number(start.slice(5, 7))}`, minutes, completed };
  });

  const monthly = [];
  const now = new Date(`${today}T00:00:00Z`);
  for (let index = 5; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    const prefix = date.toISOString().slice(0, 7);
    let minutes = 0;
    let completed = 0;
    let sessions = 0;
    for (const row of rows) {
      if (row.day?.startsWith(prefix)) {
        minutes += row.minutes ?? 0;
        sessions += row.sessions ?? 0;
      }
    }
    for (const row of completionByDay) if (row.day?.startsWith(prefix)) completed += row.completed ?? 0;
    monthly.push({ month: prefix, label: `${BN_MONTHS[date.getUTCMonth()]}`, minutes, completed, sessions });
  }

  return { daily, weekly, monthly, minutesByDay, completedByDay };
}

/** Short, honest Bangla sentences the student can act on. */
function buildInsights({ totals, subjects, chapters, topics, streak, weekly, exams }) {
  const insights = [];

  const withData = subjects.filter((subject) => subject.answered >= MIN_ANSWERS_FOR_VERDICT);
  if (withData.length) {
    const best = [...withData].sort((a, b) => b.accuracy - a.accuracy)[0];
    const worst = [...withData].sort((a, b) => a.accuracy - b.accuracy)[0];
    insights.push(`${best.name}-এ তোমার accuracy সবচেয়ে ভালো (${best.accuracy}%)।`);
    if (worst.accuracy < WEAK_ACCURACY && worst.name !== best.name) {
      insights.push(`${worst.name}-এ accuracy ${worst.accuracy}% — এই subject-টা আগে রিভিশন দরকার।`);
    }

    const weakChapters = chapters.filter((chapter) => chapter.hasEnoughData && chapter.accuracy < WEAK_ACCURACY);
    if (weakChapters.length) {
      const chapter = [...weakChapters].sort((a, b) => a.accuracy - b.accuracy)[0];
      insights.push(`${best.name}-এ performance ভালো, কিন্তু ${chapter.label}-এ accuracy মাত্র ${chapter.accuracy}%।`);
    }
  } else if (totals.questionsAnswered > 0) {
    insights.push(`এখনো ${MIN_ANSWERS_FOR_VERDICT}টার কম প্রশ্নের উত্তর দিয়েছ — আরও কয়েকটা quiz বা exam দিলে দুর্বল জায়গা ধরা পড়বে।`);
  } else {
    insights.push('এখনো কোনো প্রশ্নের উত্তর দাওনি — Quiz বা Exam দিয়ে নিজেকে যাচাই করে দেখো।');
  }

  const weakTopics = topics.weak.length;
  if (weakTopics) insights.push(`${weakTopics}টা topic-এ accuracy ${WEAK_ACCURACY}%-এর নিচে — Revision পেজে এগুলো আগে নাও।`);

  if (streak.current >= 2) insights.push(`টানা ${streak.current} দিন পড়েছ — এই ছন্দ ধরে রাখো।`);
  else if (streak.longest > streak.current && streak.longest > 2) {
    insights.push(`তোমার সবচেয়ে বড় streak ছিল ${streak.longest} দিন; এখন আবার শুরু করলে ফিরে আসবে।`);
  }

  const recentWeeks = weekly.slice(-3);
  const olderWeeks = weekly.slice(-6, -3);
  const recentTopics = recentWeeks.reduce((sum, week) => sum + week.completed, 0);
  const olderTopics = olderWeeks.reduce((sum, week) => sum + week.completed, 0);
  if (recentTopics > olderTopics && recentTopics > 0) insights.push('গত ৩ সপ্তাহে আগের চেয়ে বেশি topic শেষ করেছ — গতি বেড়েছে।');
  else if (recentTopics < olderTopics && olderTopics > 0) {
    insights.push('গত ৩ সপ্তাহে আগের চেয়ে কম topic শেষ হয়েছে — আজ অন্তত ১টা topic complete করার চেষ্টা করো।');
  }

  if (totals.remainingTopics > 0 && totals.completedPerDay > 0) {
    const daysLeft = Math.ceil(totals.remainingTopics / totals.completedPerDay);
    insights.push(
      `এখনকার গতিতে (দিনে প্রায় ${round(totals.completedPerDay)}টা topic) বাকি ${totals.remainingTopics}টা topic শেষ করতে আরও ${daysLeft} দিন লাগবে।`
    );
  }

  if (exams.totalExams >= 2) {
    const trend = exams.trend.map((entry) => entry.percentage);
    const delta = trend[trend.length - 1] - trend[trend.length - 2];
    if (delta > 0) insights.push(`শেষ exam-এ আগের চেয়ে ${delta}% ভালো করেছ।`);
    else if (delta < 0) insights.push(`শেষ exam-এ আগের চেয়ে ${Math.abs(delta)}% কম হয়েছে — ভুল প্রশ্নগুলো একবার দেখে নাও।`);
  }

  return insights;
}

export function buildAdvancedAnalytics(userId) {
  const tree = buildProgressTree(userId);
  const stats = buildStudyStats(userId);
  const exams = examStats(userId);
  const { quiz, exams: examRows } = answeredQuestions(userId);
  const groups = accuracyGroups(quiz);
  const history = activityHistory(userId);

  // ---- totals -------------------------------------------------------------
  const totals = {
    subjects: tree.subjects.length,
    chapters: tree.semester.totalChapters,
    chaptersCompleted: tree.semester.completedChapters,
    topics: tree.semester.progress.total,
    topicsCompleted: tree.semester.progress.completed,
    remainingTopics: tree.semester.progress.total - tree.semester.progress.completed,
    semesterPercent: tree.semester.progress.percent,
    studySessions: stats.sessionCount,
    studyMinutes: stats.totalMinutes,
    averageSessionMinutes: stats.averageSessionMinutes,
    questionsAnswered: quiz.length,
    correctAnswers: quiz.filter((answer) => answer.isCorrect).length,
    wrongAnswers: quiz.filter((answer) => !answer.isCorrect).length,
    accuracy: quiz.length ? Math.round((quiz.filter((a) => a.isCorrect).length / quiz.length) * 100) : 0,
    perQuestionAccuracy: groups.bySubject.length
      ? Math.round(
          (groups.bySubject.reduce((sum, entry) => sum + entry.awarded, 0) /
            Math.max(1, groups.bySubject.reduce((sum, entry) => sum + entry.maxPoints, 0))) *
            100
        )
      : 0,
    exams: exams.totalExams,
    averageExamScore: exams.averagePercentage,
    bestExamScore: exams.best,
    lowestExamScore: exams.lowest,
    examQuestions: exams.totalQuestionsAnswered,
    examCorrect: exams.totalCorrect,
    examWrong: exams.totalWrong,
    examUnanswered: exams.totalUnanswered,
    // counted from the topics themselves, so it can never disagree with the Revision page
    revisionDue: tree.subjects
      .flatMap((subject) => subject.chapters.flatMap((chapter) => chapter.topics))
      .filter((topic) => topic.revisionDue).length,
  };
  totals.completedPerDay = history.daily.slice(-14).reduce((sum, day) => sum + day.completed, 0) / 14;

  // ---- subject / chapter / topic performance ------------------------------
  const accuracyBySubject = new Map(groups.bySubject.map((entry) => [entry.key, entry]));
  const accuracyByChapter = new Map(groups.byChapter.map((entry) => [entry.key, entry]));
  const accuracyByTopic = new Map(groups.byTopic.map((entry) => [entry.key, entry]));

  const subjectPerformance = tree.subjects.map((subject) => {
    const accuracy = accuracyBySubject.get(subject.id) ?? { answered: 0, correct: 0, accuracy: 0, hasEnoughData: false };
    const study = stats.bySubject.find((row) => row.subjectId === subject.id) ?? { minutes: 0, sharePercent: 0 };
    const exam = exams.bySubject.find((row) => row.subjectId === subject.id) ?? { attempts: 0, averagePercentage: 0, best: 0 };
    return {
      subjectId: subject.id,
      name: subject.name,
      color: subject.color,
      progressPercent: subject.progress.percent,
      completedTopics: subject.progress.completed,
      totalTopics: subject.progress.total,
      studyMinutes: study.minutes,
      studySharePercent: study.sharePercent,
      questionsAnswered: accuracy.answered,
      accuracy: accuracy.accuracy,
      hasEnoughData: accuracy.hasEnoughData,
      exams: exam.attempts,
      averageExamScore: exam.averagePercentage,
      bestExamScore: exam.best,
    };
  });

  const chapterPerformance = tree.subjects.flatMap((subject) =>
    subject.chapters.map((chapter) => {
      const key = `${subject.name}|${chapter.number}|${chapter.name}`;
      const accuracy = accuracyByChapter.get(key) ?? { answered: 0, correct: 0, accuracy: 0, hasEnoughData: false };
      return {
        subjectName: subject.name,
        chapterId: chapter.id,
        label: `Ch ${chapter.number}: ${chapter.name}`,
        progressPercent: chapter.progress.percent,
        completedTopics: chapter.progress.completed,
        totalTopics: chapter.progress.total,
        answered: accuracy.answered,
        accuracy: accuracy.accuracy,
        hasEnoughData: accuracy.hasEnoughData,
      };
    })
  );

  const topicPerformance = tree.subjects.flatMap((subject) =>
    subject.chapters.flatMap((chapter) =>
      chapter.topics.map((topic) => {
        const accuracy = accuracyByTopic.get(topic.id) ?? { answered: 0, correct: 0, accuracy: 0, hasEnoughData: false };
        return {
          topicId: topic.id,
          name: topic.name,
          subjectName: subject.name,
          chapterLabel: `Ch ${chapter.number}`,
          status: topic.status,
          revisionStage: topic.revisionStage,
          revisionDue: topic.revisionDue,
          answered: accuracy.answered,
          correct: accuracy.correct,
          accuracy: accuracy.accuracy,
          hasEnoughData: accuracy.hasEnoughData,
        };
      })
    )
  );

  const topics = {
    weak: topicPerformance
      .filter((topic) => topic.hasEnoughData && topic.accuracy < WEAK_ACCURACY)
      .sort((a, b) => a.accuracy - b.accuracy || a.name.localeCompare(b.name)),
    strong: topicPerformance
      .filter((topic) => topic.hasEnoughData && topic.accuracy >= 80)
      .sort((a, b) => b.accuracy - a.accuracy || a.name.localeCompare(b.name)),
    unmeasured: topicPerformance.filter((topic) => topic.answered === 0).length,
  };

  const correctVsWrong = {
    quizCorrect: totals.correctAnswers,
    quizWrong: totals.wrongAnswers,
    examCorrect: totals.examCorrect,
    examWrong: totals.examWrong,
    examUnanswered: totals.examUnanswered,
  };

  const streak = {
    current: stats.currentStreak,
    longest: stats.longestStreak,
    activeDays: stats.activeDays,
    daysStudiedThisMonth: history.daily.filter((day) => day.minutes > 0 && day.day.slice(0, 7) === todayLocalDate().slice(0, 7)).length,
  };

  const insights = buildInsights({
    totals,
    subjects: subjectPerformance,
    chapters: chapterPerformance,
    topics,
    streak,
    weekly: history.weekly,
    exams,
  });

  return {
    generatedAt: new Date().toISOString(),
    totals,
    subjectPerformance,
    chapterPerformance,
    topics,
    chartData: {
      subjectProgress: subjectPerformance.map((subject) => ({
        name: subject.name.length > 14 ? `${subject.name.slice(0, 13)}…` : subject.name,
        percent: subject.progressPercent,
      })),
      subjectAccuracy: subjectPerformance
        .filter((subject) => subject.questionsAnswered > 0)
        .map((subject) => ({ name: subject.name.length > 14 ? `${subject.name.slice(0, 13)}…` : subject.name, accuracy: subject.accuracy })),
      examTrend: exams.trend.map((entry, index) => ({ name: `#${index + 1}`, percentage: entry.percentage })),
      dailyActivity: history.daily,
      weeklyProgress: history.weekly,
      monthlyProgress: history.monthly,
      correctVsWrong: [
        { name: 'সঠিক', value: correctVsWrong.quizCorrect + correctVsWrong.examCorrect },
        { name: 'ভুল', value: correctVsWrong.quizWrong + correctVsWrong.examWrong },
        { name: 'উত্তর দাওনি', value: correctVsWrong.examUnanswered },
      ],
      revisionByStage: tree.subjects
        .flatMap((subject) => subject.chapters.flatMap((chapter) => chapter.topics))
        .reduce((acc, topic) => {
          acc[topic.revisionStage] = (acc[topic.revisionStage] ?? 0) + 1;
          return acc;
        }, {}),
    },
    streak,
    insights,
    studyTime: {
      totalMinutes: stats.totalMinutes,
      averageSessionMinutes: stats.averageSessionMinutes,
      mostStudied: stats.mostStudied,
      leastStudied: stats.leastStudied,
      bySubject: stats.bySubject,
    },
    examStats: exams,
    weakTopicIds: exams.weakTopicIds,
  };
}
