import { useEffect, useMemo, useState } from 'react';
import { ListChecks, Clock, Play, AlertCircle, Info } from 'lucide-react';
import { api } from '../../api/client.js';
import { Card, CardHeader, Button, Badge, Spinner } from '../ui/index.jsx';

/**
 * Exam setup (Phase 5).
 *
 * The student picks Subject → Chapter → Topic (each level optional), how many
 * questions and how long the exam runs. Before starting, the screen shows how
 * many questions that scope actually has, so an exam never starts empty:
 *   - "ব্যাংক" = the questions the student wrote themselves in Quiz
 *   - "pattern" = MCQ made by the pattern-based generator (no AI API)
 */
const COUNT_CHOICES = [5, 10, 20, 30];
const MINUTE_CHOICES = [10, 15, 20, 30, 45, 60];

export default function ExamSetup({ subjects, onStart, busy }) {
  const [scope, setScope] = useState({ subjectId: '', chapterId: '', topicId: '' });
  const [questionCount, setQuestionCount] = useState(10);
  const [durationMinutes, setDurationMinutes] = useState(15);
  const [availability, setAvailability] = useState(null);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const subject = useMemo(
    () => subjects.find((entry) => entry.id === Number(scope.subjectId)) ?? null,
    [subjects, scope.subjectId]
  );
  const chapter = useMemo(
    () => subject?.chapters.find((entry) => entry.id === Number(scope.chapterId)) ?? null,
    [subject, scope.chapterId]
  );

  // keep the lower levels valid when the upper one changes
  useEffect(() => {
    if (!subject) return;
    if (!subject.chapters.some((entry) => entry.id === Number(scope.chapterId))) {
      setScope((current) => ({ ...current, chapterId: '', topicId: '' }));
    }
  }, [subject, scope.chapterId]);

  useEffect(() => {
    if (!chapter) return;
    if (!chapter.topics.some((entry) => entry.id === Number(scope.topicId))) {
      setScope((current) => ({ ...current, topicId: '' }));
    }
  }, [chapter, scope.topicId]);

  useEffect(() => {
    let cancelled = false;
    setLoadingAvailability(true);
    api.exams
      .availability({
        subjectId: scope.subjectId || undefined,
        chapterId: scope.chapterId || undefined,
        topicId: scope.topicId || undefined,
      })
      .then((data) => {
        if (!cancelled) setAvailability(data);
      })
      .catch(() => {
        if (!cancelled) setAvailability(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailability(false);
      });
    return () => {
      cancelled = true;
    };
  }, [scope.subjectId, scope.chapterId, scope.topicId]);

  const start = () => {
    onStart({
      subjectId: scope.subjectId ? Number(scope.subjectId) : undefined,
      chapterId: scope.chapterId ? Number(scope.chapterId) : undefined,
      topicId: scope.topicId ? Number(scope.topicId) : undefined,
      questionCount,
      durationMinutes,
    });
  };

  const enough = (availability?.total ?? 0) >= questionCount;

  return (
    <Card>
      <CardHeader title="Exam শুরু করো" subtitle="Subject → Chapter → Topic বেছে নাও" icon={ListChecks} />
      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block">
            <span className="label">Subject</span>
            <select
              className="input"
              value={scope.subjectId}
              onChange={(event) => setScope({ subjectId: event.target.value, chapterId: '', topicId: '' })}
            >
              <option value="">সব subject</option>
              {subjects.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Chapter</span>
            <select
              className="input"
              value={scope.chapterId}
              disabled={!subject}
              onChange={(event) => setScope((current) => ({ ...current, chapterId: event.target.value, topicId: '' }))}
            >
              <option value="">সব chapter</option>
              {(subject?.chapters ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  Ch {entry.number}: {entry.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="label">Topic</span>
            <select
              className="input"
              value={scope.topicId}
              disabled={!chapter}
              onChange={(event) => setScope((current) => ({ ...current, topicId: event.target.value }))}
            >
              <option value="">সব topic</option>
              {(chapter?.topics ?? []).map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <span className="label">প্রশ্ন সংখ্যা</span>
            <div className="flex flex-wrap gap-2">
              {COUNT_CHOICES.map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => setQuestionCount(count)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
                    questionCount === count
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className="label">সময় (মিনিট)</span>
            <div className="flex flex-wrap gap-2">
              {MINUTE_CHOICES.map((minutes) => (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDurationMinutes(minutes)}
                  className={`rounded-xl border px-3 py-1.5 text-sm font-medium ${
                    durationMinutes === minutes
                      ? 'border-brand-300 bg-brand-50 text-brand-700'
                      : 'border-ink-200 bg-white text-ink-600 hover:bg-ink-50'
                  }`}
                >
                  {minutes}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-ink-200 bg-ink-50/60 p-3 text-sm">
          {loadingAvailability ? (
            <Spinner label="প্রশ্ন গোনা হচ্ছে..." />
          ) : availability ? (
            <div className="space-y-1.5">
              <p className="text-ink-700">
                <strong>{availability.scopeLabel}</strong> · {availability.topicsInScope} টা topic
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  নিজের প্রশ্ন ব্যাংক: {availability.bank}
                </Badge>
                <Badge className="border-brand-200 bg-brand-50 text-brand-700">
                  pattern-based MCQ: {availability.generated}
                </Badge>
                <Badge>মোট: {availability.total}</Badge>
              </div>
              {!enough && availability.total > 0 && (
                <p className="text-xs text-amber-700">
                  <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                  {questionCount} টা চাইলেও এই scope-এ {Math.min(questionCount, availability.total)} টা প্রশ্ন পাওয়া যাবে — exam ততগুলো দিয়েই হবে।
                </p>
              )}
              {availability.total === 0 && (
                <p className="text-xs text-rose-600">
                  <AlertCircle className="mr-1 inline h-3.5 w-3.5" />
                  এই scope-এ কোনো প্রশ্ন নেই। অন্য chapter বেছে নাও, অথবা Quiz পেজে প্রশ্ন যোগ করো।
                </p>
              )}
            </div>
          ) : (
            <p className="muted">প্রশ্নের হিসাব আনা গেল না — তবু exam শুরু করে দেখা যাবে।</p>
          )}
        </div>

        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            প্রশ্ন আসে শুধু তোমার বাছা scope থেকেই — এক subject-এর প্রশ্ন অন্য subject-এ কখনো আসে না। উত্তর exam
            জমা দেওয়ার আগে পর্যন্ত server-এ লুকানো থাকে, তাই স্কোরটা সত্যিই তোমার।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={start} disabled={busy || (availability ? availability.total === 0 : false)}>
            <Play className="mr-1.5 h-4 w-4" />
            {busy ? 'তৈরি হচ্ছে...' : `Exam শুরু করো (${questionCount} প্রশ্ন · ${durationMinutes} মিনিট)`}
          </Button>
          <span className="muted flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            সময় শেষ হলে exam নিজেই জমা হয়ে যাবে
          </span>
        </div>
      </div>
    </Card>
  );
}
