import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
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
import { BarChart3, TrendingDown, TrendingUp, Clock, Timer } from 'lucide-react';
import { Card, CardHeader, StatCard, EmptyState } from '../components/ui/index.jsx';
import { Donut } from '../components/ui/ProgressBar.jsx';
import { api } from '../api/client.js';
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
  const [study, setStudy] = useState(null);

  // Study analytics come from stored timer sessions (Phase 2) — nothing here is
  // estimated, so an empty database simply shows zeros.
  useEffect(() => {
    let cancelled = false;
    api
      .analytics()
      .then((data) => {
        if (!cancelled) setStudy(data);
      })
      .catch(() => {
        if (!cancelled) setStudy(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

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
          <CardHeader title="Study Time" subtitle="Study Session timer-এ মাপা আসল সময়" icon={Clock} />
          <div className="space-y-4 p-4 sm:p-5">
            <div className="grid grid-cols-2 gap-3">
              <StatCard label="মোট Study Time" value={minutesLabel(studyStats.totalStudyMinutes ?? 0)} />
              <StatCard label="আজ" value={minutesLabel(studyStats.todayStudyMinutes ?? 0)} />
              <StatCard label="শেষ ৭ দিন" value={minutesLabel(study?.weekMinutes ?? 0)} />
              <StatCard label="গড় সেশন" value={minutesLabel(study?.averageSessionMinutes ?? 0)} hint={`${study?.sessionCount ?? 0} টা সেশন`} />
            </div>

            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={study?.last7Days ?? []} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip formatter={(value) => [minutesLabel(value), 'পড়া']} />
                  <Bar dataKey="minutes" radius={[6, 6, 0, 0]}>
                    {(study?.last7Days ?? []).map((day) => (
                      <Cell key={day.day} fill={day.isToday ? '#4f46e5' : '#c7d2fe'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {study?.mostStudied ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                  <div className="muted">সবচেয়ে বেশি পড়া subject</div>
                  <div className="text-sm font-semibold text-ink-900">{study.mostStudied.name}</div>
                  <div className="muted">{minutesLabel(study.mostStudied.minutes)}</div>
                </div>
                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3">
                  <div className="muted">সবচেয়ে কম পড়া subject</div>
                  <div className="text-sm font-semibold text-ink-900">{study.leastStudied?.name ?? '—'}</div>
                  <div className="muted">{minutesLabel(study.leastStudied?.minutes ?? 0)}</div>
                </div>
              </div>
            ) : (
              <p className="muted">
                এখনো কোনো সেশন নেই, তাই study time ০ — বানানো সংখ্যা দেখানোর চেয়ে খালি রাখা ভালো। Timer চালালেই
                এখানে ৭ দিনের graph, streak আর সবচেয়ে বেশি/কম পড়া subject দেখা যাবে।
              </p>
            )}

            {study?.bySubject?.some((row) => row.minutes > 0) ? (
              <ul className="divide-y divide-ink-100 rounded-xl border border-ink-100">
                {study.bySubject
                  .filter((row) => row.minutes > 0)
                  .map((row) => (
                    <li key={row.subjectId} className="flex items-center justify-between gap-3 px-3 py-2">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-ink-700">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: row.subjectColor }} />
                        <span className="truncate">{row.subjectName}</span>
                      </span>
                      <span className="shrink-0 text-xs font-semibold text-ink-800">
                        {minutesLabel(row.minutes)} · {row.sharePercent}%
                      </span>
                    </li>
                  ))}
              </ul>
            ) : null}

            <p className="muted">
              এই সংখ্যাগুলো শুধু Study Session timer থেকে আসে — তুমি যত মিনিট সত্যিই পড়েছ, ঠিক ততটাই যোগ হয়। কোনো
              হাতে বানানো সময় এখানে ঢোকানোর উপায় নেই।
            </p>
            <Link className="btn-ghost" to="/study">
              <Timer className="h-4 w-4" />
              Study timer চালাও
            </Link>
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
