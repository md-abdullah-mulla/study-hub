import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Printer, ArrowLeft, FileText, AlertTriangle } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, Button, Spinner } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { minutesLabel, formatDate } from '../lib/format.js';
import { REVISION_STAGE_LABEL, TOPIC_STATUS } from '../lib/status.js';

/**
 * PRINTABLE REPORT → "Export Report as PDF" (Phase 5).
 *
 * Why the browser makes the PDF instead of the server: Bangla needs proper text
 * shaping (যুক্তাক্ষর, কার, রেফ). Browsers do that perfectly, a plain PDF writer
 * does not, so the honest solution is a print-ready page + the browser's own
 * print-to-PDF. Nothing here is a screenshot: it is real text, so the PDF stays
 * searchable and readable.
 *
 * The report contains: student name (from Settings → /api/meta), generated date, overall progress, subject
 * and chapter performance, exam results, weak/strong topics, study statistics.
 */
const REPORTABLE_STATUSES = ['not_started', 'studying', 'completed', 'needs_revision'];

export default function ReportPage() {
  const { subjects, semester, dashboard, meta } = useAppData();
  const [advanced, setAdvanced] = useState(null);
  const [error, setError] = useState(null);
  const [trimesterNote] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .advancedAnalytics()
      .then((data) => {
        if (!cancelled) setAdvanced(data);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader title="Report তৈরি করা গেল না" subtitle={error} icon={AlertTriangle} />
      </Card>
    );
  }
  if (!advanced) return <Spinner label="Report তৈরি হচ্ছে..." />;

  const { totals, subjectPerformance, topics, streak, studyTime, examStats, insights } = advanced;
  const generatedAt = new Date(advanced.generatedAt);
  void trimesterNote;

  const statusCounts = subjects
    .flatMap((subject) => subject.chapters.flatMap((chapter) => chapter.topics))
    .reduce((acc, topic) => {
      acc[topic.status] = (acc[topic.status] ?? 0) + 1;
      return acc;
    }, {});

  return (
    <div className="space-y-4">
      {/* toolbar — hidden in the printed/PDF version */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2">
        <Link to="/analytics" className="btn-ghost">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Analytics-এ ফিরে যাও
        </Link>
        <div className="flex items-center gap-2">
          <Button onClick={() => window.print()}>
            <Printer className="mr-1.5 h-4 w-4" />
            Export Report as PDF
          </Button>
        </div>
      </div>

      <p className="no-print rounded-2xl border border-brand-100 bg-brand-50/70 p-3 text-sm text-ink-700">
        <strong>কীভাবে PDF হবে:</strong> উপরের বাটনে চাপলে browser-এর print window খুলবে — সেখানে Destination-এ
        <strong> “Save as PDF”</strong> বেছে Save করো। Bangla লেখা ঠিকভাবে আসবে, কারণ PDF টা browser নিজেই বানায়।
      </p>

      {/* ============================ the report itself ============================ */}
      <div className="print-area space-y-5 rounded-2xl border border-ink-200 bg-white p-5">
        <header className="flex flex-wrap items-start justify-between gap-3 border-b border-ink-200 pb-4">
          <div>
            <h1 className="text-xl font-bold text-ink-900">Smart Semester Study Report</h1>
            <p className="muted mt-0.5">
              Diploma in Computer Science &amp; Technology · Semester 6 · Smart Semester Study Management System
            </p>
          </div>
          <div className="text-right text-xs text-ink-600">
            {meta?.studentName ? (
              <p>
                <strong>Student:</strong> {meta.studentName}
              </p>
            ) : null}
            <p>
              <strong>Report তৈরি:</strong> {formatDate(generatedAt.toISOString())}
            </p>
          </div>
        </header>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">১. Overall Progress</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Semester progress', value: `${semester.progress.percent}%` },
              { label: 'Topic complete', value: `${totals.topicsCompleted} / ${totals.topics}` },
              { label: 'Chapter complete', value: `${totals.chaptersCompleted} / ${totals.chapters}` },
              { label: 'Revision due', value: totals.revisionDue },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-ink-200 p-3">
                <p className="text-[11px] text-ink-500">{item.label}</p>
                <p className="text-lg font-semibold text-ink-900">{item.value}</p>
              </div>
            ))}
          </div>
          <table className="mt-3 w-full border-collapse text-sm">
            <tbody>
              {REPORTABLE_STATUSES.map((status) => (
                <tr key={status} className="border-b border-ink-100">
                  <td className="py-1.5 text-ink-600">{TOPIC_STATUS[status]?.label ?? status}</td>
                  <td className="py-1.5 text-right font-medium text-ink-800">{statusCounts[status] ?? 0} টা topic</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">২. Subject-wise performance</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-300 text-left text-xs text-ink-500">
                <th className="py-1.5">Subject</th>
                <th className="py-1.5">Progress</th>
                <th className="py-1.5">Topic</th>
                <th className="py-1.5">পড়ার সময়</th>
                <th className="py-1.5">Accuracy</th>
                <th className="py-1.5">Exam গড়</th>
              </tr>
            </thead>
            <tbody>
              {subjectPerformance.map((subject) => (
                <tr key={subject.subjectId} className="border-b border-ink-100">
                  <td className="py-1.5 font-medium text-ink-800">{subject.name}</td>
                  <td className="py-1.5">{subject.progressPercent}%</td>
                  <td className="py-1.5">
                    {subject.completedTopics}/{subject.totalTopics}
                  </td>
                  <td className="py-1.5">{minutesLabel(subject.studyMinutes)}</td>
                  <td className="py-1.5">
                    {subject.questionsAnswered > 0 ? `${subject.accuracy}% (${subject.questionsAnswered} প্রশ্ন)` : '— (প্রশ্ন দাওনি)'}
                  </td>
                  <td className="py-1.5">{subject.exams > 0 ? `${subject.averageExamScore}%` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৩. Exam results</h2>
          {examStats.totalExams === 0 ? (
            <p className="text-sm text-ink-600">এখনো কোনো exam দেওয়া হয়নি।</p>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: 'মোট exam', value: examStats.totalExams },
                  { label: 'গড় স্কোর', value: `${examStats.averagePercentage}%` },
                  { label: 'সেরা', value: `${examStats.best}%` },
                  { label: 'সবচেয়ে কম', value: `${examStats.lowest}%` },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-ink-200 p-3">
                    <p className="text-[11px] text-ink-500">{item.label}</p>
                    <p className="text-lg font-semibold text-ink-900">{item.value}</p>
                  </div>
                ))}
              </div>
              <table className="mt-3 w-full border-collapse text-sm">
                <tbody>
                  {examStats.bySubject.map((row) => (
                    <tr key={`${row.subjectName}-${row.subjectId}`} className="border-b border-ink-100">
                      <td className="py-1.5 text-ink-700">{row.subjectName}</td>
                      <td className="py-1.5 text-right">
                        {row.attempts} টা exam · গড় {row.averagePercentage}% · সেরা {row.best}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৪. Study statistics</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'মোট পড়ার সময়', value: minutesLabel(studyTime.totalMinutes) },
              { label: 'Study session', value: totals.studySessions },
              { label: 'গড় session', value: `${studyTime.averageSessionMinutes} মিনিট` },
              { label: 'Streak (এখন)', value: `${streak.current} দিন` },
              { label: 'Streak (সর্বোচ্চ)', value: `${streak.longest} দিন` },
              { label: 'পড়ার দিন', value: streak.activeDays },
              { label: 'সবচেয়ে বেশি পড়া', value: studyTime.mostStudied?.name ?? '—' },
              { label: 'সবচেয়ে কম পড়া', value: studyTime.leastStudied?.name ?? '—' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl border border-ink-200 p-3">
                <p className="text-[11px] text-ink-500">{item.label}</p>
                <p className="text-sm font-semibold text-ink-900">{item.value}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৫. দুর্বল ও শক্ত topic</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-rose-200 p-3">
              <p className="mb-1 text-sm font-semibold text-rose-700">দুর্বল (accuracy ৬০%-এর নিচে)</p>
              {topics.weak.length === 0 ? (
                <p className="text-sm text-ink-600">নেই — ভালো!</p>
              ) : (
                <ul className="list-disc pl-4 text-sm text-ink-700">
                  {topics.weak.slice(0, 12).map((topic) => (
                    <li key={topic.topicId}>
                      {topic.name} — {topic.accuracy}% ({topic.subjectName})
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="rounded-xl border border-emerald-200 p-3">
              <p className="mb-1 text-sm font-semibold text-emerald-700">শক্ত (accuracy ৮০%+)</p>
              {topics.strong.length === 0 ? (
                <p className="text-sm text-ink-600">এখনো জমা হয়নি।</p>
              ) : (
                <ul className="list-disc pl-4 text-sm text-ink-700">
                  {topics.strong.slice(0, 12).map((topic) => (
                    <li key={topic.topicId}>
                      {topic.name} — {topic.accuracy}% ({topic.subjectName})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৬. Revision অবস্থা</h2>
          <table className="w-full border-collapse text-sm">
            <tbody>
              {Object.entries(advanced.chartData.revisionByStage).map(([stage, count]) => (
                <tr key={stage} className="border-b border-ink-100">
                  <td className="py-1.5 text-ink-600">{REVISION_STAGE_LABEL[stage] ?? stage}</td>
                  <td className="py-1.5 text-right font-medium text-ink-800">{count} টা topic</td>
                </tr>
              ))}
              <tr>
                <td className="py-1.5 text-ink-600">এখন revision due</td>
                <td className="py-1.5 text-right font-medium text-ink-800">{totals.revisionDue} টা topic</td>
              </tr>
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৭. বিশ্লেষণ (Insights)</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink-700">
            {insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-ink-900">৮. Chapter-wise accuracy</h2>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-ink-300 text-left text-xs text-ink-500">
                <th className="py-1.5">Chapter</th>
                <th className="py-1.5">Progress</th>
                <th className="py-1.5">উত্তর দেওয়া প্রশ্ন</th>
                <th className="py-1.5">Accuracy</th>
              </tr>
            </thead>
            <tbody>
              {advanced.chapterPerformance
                .filter((chapter) => chapter.answered > 0)
                .map((chapter) => (
                  <tr key={`${chapter.subjectName}-${chapter.chapterId}`} className="border-b border-ink-100">
                    <td className="py-1.5 text-ink-700">
                      {chapter.subjectName} · {chapter.label}
                    </td>
                    <td className="py-1.5">{chapter.progressPercent}%</td>
                    <td className="py-1.5">{chapter.answered}</td>
                    <td className="py-1.5">{chapter.accuracy}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <footer className="border-t border-ink-200 pt-3 text-[11px] text-ink-500">
          <p>
            এই report-এর প্রতিটি সংখ্যা তোমার নিজের progress, timer-এর সময় আর সত্যি উত্তর দেওয়া প্রশ্ন থেকে হিসাব করা —
            কোনো সংখ্যা অনুমান করা নয়। Report-টা Smart Semester Study Manager থেকে {formatDate(generatedAt.toISOString())} তারিখে
            তৈরি হয়েছে। {dashboard?.planDate ? `আজকের plan: ${dashboard.planDate}` : ''}
          </p>
          <p className="mt-1 flex items-center gap-1">
            <FileText className="h-3 w-3" /> Print → Save as PDF দিয়ে সংরক্ষণ করা হয়েছে।
          </p>
        </footer>
      </div>
    </div>
  );
}
