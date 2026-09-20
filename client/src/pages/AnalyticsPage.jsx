import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { BarChart3, TrendingDown, TrendingUp, Clock } from 'lucide-react';
import { Card, CardHeader, StatCard, EmptyState } from '../components/ui/index.jsx';
import { Donut } from '../components/ui/ProgressBar.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { TOPIC_STATUS } from '../lib/status.js';
import { minutesLabel } from '../lib/format.js';

/**
 * ANALYTICS (spec §13, §29)
 * Only charts that answer a question are shown:
 *  - status donut   → কোন অবস্থায় কত topic আছে
 *  - subject bars   → কোন subject কতটুকু শেষ
 *  - chapter list   → সবচেয়ে পিছিয়ে থাকা chapter
 * Study-time charts need the Phase 2 timer, so that block says so instead of
 * showing invented numbers.
 */
export default function AnalyticsPage() {
  const { subjects, semester, dashboard } = useAppData();

  const allTopics = useMemo(
    () => subjects.flatMap((s) => s.chapters.flatMap((c) => c.topics)),
    [subjects]
  );

  const byStatus = useMemo(() => {
    const counts = { not_started: 0, studying: 0, completed: 0, needs_revision: 0 };
    for (const topic of allTopics) counts[topic.status] += 1;
    return counts;
  }, [allTopics]);

  const subjectBars = useMemo(
    () =>
      subjects.map((s) => ({
        name: s.name.length > 16 ? `${s.name.slice(0, 15)}…` : s.name,
        fullName: s.name,
        percent: s.progress.percent,
        color: s.color,
        topics: s.progress.total,
      })),
    [subjects]
  );

  const chapterRows = useMemo(
    () =>
      subjects
        .flatMap((s) => s.chapters.map((c) => ({ subject: s, chapter: c })))
        .filter((row) => row.chapter.progress.total > 0)
        .sort((a, b) => a.chapter.progress.percent - b.chapter.progress.percent)
        .slice(0, 6),
    [subjects]
  );

  const best = [...subjects].sort((a, b) => b.progress.percent - a.progress.percent)[0];
  const weakest = [...subjects].sort((a, b) => a.progress.percent - b.progress.percent)[0];
  const studyStats = dashboard?.stats ?? {};

  if (!allTopics.length) {
    return (
      <EmptyState
        icon={BarChart3}
        title="Analytics-এর জন্য data দরকার"
        description="Subject, chapter, topic যোগ করে status আপডেট করলে এখানে chart দেখা যাবে।"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Semester" value={`${semester?.progress?.percent ?? 0}%`} tone="brand" />
        <StatCard label="Topic শেষ" value={byStatus.completed} tone="success" />
        <StatCard label="বাকি" value={semester?.progress?.remaining ?? 0} />
        <StatCard label="Revision দরকার" value={byStatus.needs_revision} tone={byStatus.needs_revision ? 'warn' : 'default'} />
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="Topic Status" subtitle={`মোট ${allTopics.length}টি topic`} icon={BarChart3} />
          <div className="flex flex-col items-center gap-5 p-4 sm:flex-row sm:p-5">
            <Donut value={semester?.progress?.percent ?? 0} size={132}>
              <span className="text-2xl font-semibold text-ink-900">{semester?.progress?.percent ?? 0}%</span>
              <span className="muted">complete</span>
            </Donut>
            <ul className="w-full space-y-2">
              {Object.entries(TOPIC_STATUS).map(([key, meta]) => (
                <li key={key} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2 text-ink-600">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: meta.dot }} />
                    {meta.label}
                  </span>
                  <span className="font-semibold text-ink-900">{byStatus[key]}</span>
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card>
          <CardHeader title="Subject-wise Completion" subtitle="%" icon={BarChart3} />
          <div className="h-64 p-4 sm:p-5">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={subjectBars} margin={{ top: 4, right: 8, left: -20, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-12} height={40} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  formatter={(value, _n, payload) => [`${value}%`, `${payload.payload.topics} topic`]}
                  labelFormatter={(_l, payload) => payload?.[0]?.payload?.fullName ?? ''}
                />
                <Bar dataKey="percent" radius={[6, 6, 0, 0]}>
                  {subjectBars.map((entry) => (
                    <Cell key={entry.fullName} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 sm:gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader title="সবচেয়ে পিছিয়ে থাকা Chapter" subtitle="এগুলো আগে ধরলে দ্রুত এগোবে" icon={TrendingDown} />
          <ul className="divide-y divide-ink-100">
            {chapterRows.map(({ subject, chapter }) => (
              <li key={chapter.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <div className="min-w-0">
                  <div className="truncate text-sm text-ink-800">
                    Chapter {chapter.number}: {chapter.name}
                  </div>
                  <div className="muted truncate">{subject.name}</div>
                </div>
                <span className="shrink-0 text-xs font-semibold text-ink-700">{chapter.progress.percent}%</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader title="Study Time" subtitle="Phase 2-এ Study Session timer যোগ হবে" icon={Clock} />
          <div className="space-y-3 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="মোট Study Time" value={minutesLabel(studyStats.totalStudyMinutes ?? 0)} />
              <StatCard label="আজ" value={minutesLabel(studyStats.todayStudyMinutes ?? 0)} />
              <StatCard label="Current Streak" value={`${studyStats.currentStreak ?? 0} দিন`} />
              <StatCard label="Longest Streak" value={`${studyStats.longestStreak ?? 0} দিন`} />
            </div>
            <p className="muted">
              Study time এখন ০ কারণ timer এখনো তৈরি হয়নি (Phase 2)। বানানো সংখ্যা দেখানোর চেয়ে খালি রাখা ভালো —
              সময় শেষ হলে এখানেই daily/weekly graph বসবে।
            </p>
          </div>
        </Card>
      </div>

      <Card>
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          <div className="rounded-xl bg-emerald-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <TrendingUp className="h-3.5 w-3.5" /> সবচেয়ে এগিয়ে
            </div>
            <p className="mt-1 text-sm text-ink-800">
              {best ? `${best.name} — ${best.progress.percent}%` : '—'}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 p-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
              <TrendingDown className="h-3.5 w-3.5" /> সবচেয়ে পিছিয়ে
            </div>
            <p className="mt-1 text-sm text-ink-800">
              {weakest ? `${weakest.name} — ${weakest.progress.percent}%` : '—'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
