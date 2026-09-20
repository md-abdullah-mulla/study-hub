import { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { Trophy, AlertTriangle, TrendingUp, Target, Info, ChevronDown } from 'lucide-react';
import { Card, CardHeader, Badge, StatCard, EmptyState } from '../ui/index.jsx';
import { minutesLabel } from '../../lib/format.js';

/**
 * ADVANCED ANALYTICS block (Phase 5).
 *
 * Shows what the data actually says and nothing more:
 *  - accuracy per subject / chapter / topic only when questions were answered
 *  - a topic is called weak below 60 % accuracy *with enough answers*
 *  - insights are sentences built from those real numbers
 * Charts are limited to the ones that answer a question (trend, activity,
 * correct vs wrong) — everything else is a number or a short table.
 */
const CHART_COLORS = ['#2554e0', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981'];

const AccuracyBar = ({ label, value, tone }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs text-ink-600">
      <span className="truncate">{label}</span>
      <span className="font-semibold text-ink-800">{value}%</span>
    </div>
    <div className="h-2 overflow-hidden rounded-full bg-ink-100">
      <div
        className={`h-full rounded-full ${tone === 'weak' ? 'bg-rose-500' : tone === 'strong' ? 'bg-emerald-500' : 'bg-brand-500'}`}
        style={{ width: `${Math.min(100, Math.max(2, value))}%` }}
      />
    </div>
  </div>
);

export default function AdvancedAnalytics({ data, error }) {
  const [showAllChapters, setShowAllChapters] = useState(false);

  if (error) {
    return (
      <Card>
        <CardHeader title="Performance report" subtitle="আনা গেল না" icon={AlertTriangle} />
        <p className="p-4 text-sm text-rose-600">{error}</p>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader title="Performance report" subtitle="হিসাব করা হচ্ছে..." icon={TrendingUp} />
      </Card>
    );
  }

  const { totals, subjectPerformance, chapterPerformance, topics, chartData, streak, insights } = data;
  const chaptersWithData = chapterPerformance
    .filter((chapter) => chapter.answered > 0)
    .sort((a, b) => a.accuracy - b.accuracy);
  const weakChapters = chaptersWithData.filter((chapter) => chapter.hasEnoughData && chapter.accuracy < 60);
  // "rate" is only shown once there is something to rate
  const answeredAny = totals.questionsAnswered + totals.examQuestions > 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Performance report (advanced analytics)"
          subtitle="সব সংখ্যা তোমার আসল data থেকে — প্রশ্নের উত্তর, timer-এর সময় আর topic completion"
          icon={TrendingUp}
        />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
          <StatCard label="Study sessions" value={totals.studySessions} hint={minutesLabel(totals.studyMinutes)} />
          <StatCard label="Topic complete" value={`${totals.topicsCompleted}/${totals.topics}`} tone="brand" />
          <StatCard label="প্রশ্নের উত্তর" value={totals.questionsAnswered} hint={`quiz accuracy ${totals.perQuestionAccuracy}%`} />
          <StatCard label="Exam" value={totals.exams} hint={totals.exams ? `গড় ${totals.averageExamScore}%` : 'এখনো exam দাওনি'} />
          <StatCard
            label="সঠিক উত্তর"
            value={totals.correctAnswers + totals.examCorrect}
            hint={answeredAny ? `correct rate ${totals.accuracy}%` : 'এখনো উত্তর দাওনি'}
          />
          <StatCard
            label="ভুল উত্তর"
            value={totals.wrongAnswers + totals.examWrong}
            hint={answeredAny ? `wrong rate ${100 - totals.accuracy}%` : 'এখনো উত্তর দাওনি'}
          />
          <StatCard label="Exam সেরা" value={totals.exams ? `${totals.bestExamScore}%` : '—'} icon={Trophy} />
          <StatCard label="Exam সর্বনিম্ন" value={totals.exams ? `${totals.lowestExamScore}%` : '—'} />
          <StatCard label="Streak" value={`${streak.current} দিন`} hint={`সর্বোচ্চ ${streak.longest} দিন`} />
        </div>

        {insights.length > 0 && (
          <div className="border-t border-ink-100 p-4 sm:p-5">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-ink-900">
              <Info className="h-4 w-4" />
              এই data থেকে যা বোঝা যাচ্ছে
            </p>
            <ul className="space-y-1.5">
              {insights.map((insight) => (
                <li key={insight} className="rounded-xl border border-brand-100 bg-brand-50/60 px-3 py-2 text-sm text-ink-800">
                  {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Subject-wise performance" subtitle="progress + quiz/exam accuracy" icon={Target} />
          <div className="space-y-3 p-4 sm:p-5">
            {subjectPerformance.map((subject) => (
              <div key={subject.subjectId} className="space-y-2 rounded-xl border border-ink-100 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-ink-900">{subject.name}</span>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge>progress {subject.progressPercent}%</Badge>
                    {subject.questionsAnswered > 0 ? (
                      <Badge
                        className={
                          subject.accuracy >= 60
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                            : 'border-rose-200 bg-rose-50 text-rose-700'
                        }
                      >
                        accuracy {subject.accuracy}%
                      </Badge>
                    ) : (
                      <Badge className="border-ink-200 bg-ink-50 text-ink-500">accuracy — (প্রশ্ন দাওনি)</Badge>
                    )}
                    {subject.exams > 0 && <Badge className="border-brand-200 bg-brand-50 text-brand-700">exam {subject.averageExamScore}%</Badge>}
                  </div>
                </div>
                <AccuracyBar label={`${subject.completedTopics}/${subject.totalTopics} topic · ${minutesLabel(subject.studyMinutes)}`} value={subject.progressPercent} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Chapter-wise performance" subtitle="accuracy কম হলে আগে এগুলো রিভিশন দাও" icon={AlertTriangle} />
          {chaptersWithData.length === 0 ? (
            <EmptyState
              icon={Target}
              title="এখনো কোনো প্রশ্নের উত্তর দাওনি"
              description="Quiz বা Exam দিলে এখানে chapter-ভিত্তিক accuracy দেখা যাবে।"
            />
          ) : (
            <div className="space-y-3 p-4 sm:p-5">
              {(showAllChapters ? chaptersWithData : weakChapters.length ? weakChapters : chaptersWithData.slice(0, 4)).map((chapter) => (
                <div key={`${chapter.subjectName}-${chapter.chapterId}`}>
                  <AccuracyBar
                    label={`${chapter.subjectName} · ${chapter.label} (${chapter.answered} প্রশ্ন)`}
                    value={chapter.accuracy}
                    tone={chapter.accuracy < 60 ? 'weak' : 'strong'}
                  />
                </div>
              ))}
              {chaptersWithData.length > 4 && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => setShowAllChapters((value) => !value)}
                >
                  <ChevronDown className="mr-1 h-4 w-4" />
                  {showAllChapters ? 'সংক্ষেপে দেখাও' : `সব chapter দেখাও (${chaptersWithData.length})`}
                </button>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="দুর্বল topic" subtitle="accuracy ৬০%-এর নিচে (সত্যি উত্তর দেওয়া প্রশ্ন থেকে)" icon={AlertTriangle} />
          {topics.weak.length === 0 ? (
            <p className="p-4 text-sm text-ink-600 sm:p-5">
              এখন কোনো দুর্বল topic নেই। ({topics.unmeasured} টা topic-এ এখনো প্রশ্নের উত্তর দাওনি — তাই সেগুলো নিয়ে কোনো মন্তব্য করা হয়নি।)
            </p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {topics.weak.slice(0, 10).map((topic) => (
                <li key={topic.topicId} className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-800">{topic.name}</p>
                    <p className="muted">
                      {topic.subjectName} · {topic.chapterLabel} · {topic.correct}/{topic.answered} সঠিক
                    </p>
                  </div>
                  <Badge className="border-rose-200 bg-rose-50 text-rose-700">{topic.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="শক্ত topic" subtitle="যেখানে accuracy ৮০% বা বেশি — এগুলো ভরসার" icon={Trophy} />
          {topics.strong.length === 0 ? (
            <p className="p-4 text-sm text-ink-600 sm:p-5">এখনো ৮০%-এর বেশি accuracy-তে কোনো topic নেই — কয়েকটা quiz দিলে এখানে জমা হবে।</p>
          ) : (
            <ul className="divide-y divide-ink-100">
              {topics.strong.slice(0, 10).map((topic) => (
                <li key={topic.topicId} className="flex items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-800">{topic.name}</p>
                    <p className="muted">
                      {topic.subjectName} · {topic.correct}/{topic.answered} সঠিক
                    </p>
                  </div>
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{topic.accuracy}%</Badge>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Exam score trend" subtitle="প্রতিটি exam-এর percentage" icon={TrendingUp} />
          {chartData.examTrend.length === 0 ? (
            <p className="p-4 text-sm text-ink-600 sm:p-5">এখনো exam দাওনি — Exam Mode পেজ থেকে শুরু করো।</p>
          ) : (
            <div className="h-60 p-2 sm:p-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData.examTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                  <Tooltip formatter={(value) => [`${value}%`, 'score']} />
                  <Line type="monotone" dataKey="percentage" stroke="#2554e0" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Correct vs Wrong" subtitle="quiz + exam মিলিয়ে" icon={Target} />
          <div className="h-60 p-2 sm:p-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={chartData.correctVsWrong} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
                  {chartData.correctVsWrong.map((entry, index) => (
                    <Cell key={entry.name} fill={['#10b981', '#ef4444', '#94a3b8'][index] ?? CHART_COLORS[index]} />
                  ))}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Daily study activity" subtitle="শেষ ১৪ দিন — পড়ার সময় ও শেষ করা topic" icon={TrendingUp} />
        <div className="h-64 p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [name === 'minutes' ? `${value} মিনিট` : value, name === 'minutes' ? 'পড়ার সময়' : 'শেষ করা topic']}
              />
              <Bar dataKey="minutes" fill="#2554e0" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card>
        <CardHeader title="Weekly progress" subtitle="সপ্তাহে কত topic শেষ হলো ও কত সময় পড়েছ" icon={TrendingUp} />
        <div className="h-56 p-2 sm:p-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData.weeklyProgress}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e9f2" />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(value, name) => [name === 'minutes' ? `${value} মিনিট` : value, name === 'minutes' ? 'পড়ার সময়' : 'শেষ করা topic']}
              />
              <Bar dataKey="minutes" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-3 border-t border-ink-100 p-4 sm:grid-cols-4 sm:p-5">
          {chartData.monthlyProgress.slice(-4).map((month) => (
            <StatCard key={month.month} label={month.label} value={`${month.completed} topic`} hint={minutesLabel(month.minutes)} />
          ))}
        </div>
      </Card>
    </div>
  );
}
