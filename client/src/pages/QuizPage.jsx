import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ListChecks, Plus, Trash2, Sparkles, Target, Play, BarChart3 } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, Button, Badge, StatCard, EmptyState, Spinner, ConfirmDialog } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { formatDateShort } from '../lib/format.js';

/**
 * QUIZ (Phase 3)
 *
 * Two things live here: the quiz list (plus creating a quiz for a chapter) and
 * the honest report — average accuracy and the topics that the answered
 * questions really show as weak. A chapter with no quiz is offered a button
 * instead of a fake number.
 */
export default function QuizPage() {
  const { subjects } = useAppData();
  const toast = useToast();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ chapterId: '', title: '' });
  const [toDelete, setToDelete] = useState(null);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [quizData, resultData] = await Promise.all([api.quizzes.list(), api.quizResults.list(10)]);
      setData(quizData);
      setResults(resultData);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chapters = useMemo(
    () =>
      subjects.flatMap((subject) =>
        subject.chapters.map((chapter) => ({ id: chapter.id, label: `${subject.name} → Ch ${chapter.number}: ${chapter.name}` }))
      ),
    [subjects]
  );

  useEffect(() => {
    if (!form.chapterId && chapters.length) setForm((current) => ({ ...current, chapterId: String(chapters[0].id) }));
  }, [chapters, form.chapterId]);

  const createQuiz = async () => {
    setBusy(true);
    try {
      const quiz = await api.quizzes.create({ chapterId: Number(form.chapterId), title: form.title.trim() });
      toast.success('Quiz তৈরি হলো — এখন প্রশ্ন যোগ করো');
      setCreating(false);
      setForm((current) => ({ ...current, title: '' }));
      navigate(`/quiz/${quiz.id}`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeQuiz = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.quizzes.remove(toDelete.id);
      toast.success('Quiz মুছে ফেলা হলো');
      setToDelete(null);
      await load({ silent: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const summary = data?.summary;
  const quizzes = data?.quizzes ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Quiz" value={quizzes.length} icon={ListChecks} tone="brand" />
        <StatCard label="দেওয়া হয়েছে" value={summary?.attempts ?? 0} hint="মোট attempt" />
        <StatCard
          label="Average Accuracy"
          value={`${summary?.averageAccuracy ?? 0}%`}
          hint={summary?.attempts ? `best ${summary.bestAccuracy}%` : 'এখনো quiz দাওনি'}
        />
        <StatCard
          label="দুর্বল topic"
          value={summary?.weakTopicCount ?? 0}
          hint={summary?.topicsPractised ? `${summary.topicsPractised} টা topic পরীক্ষা হয়েছে` : 'কোনো প্রশ্ন দেওয়া হয়নি'}
          tone={(summary?.weakTopicCount ?? 0) > 0 ? 'warn' : 'default'}
        />
      </div>

      {!loading && quizzes.length === 0 && (
        <Card>
          <EmptyState
            icon={ListChecks}
            title="এখনো কোনো quiz নেই"
            description="প্রতিটা chapter-এর জন্য quiz বানাও — MCQ দ্রুত নিজে থেকে যাচাই হবে, আর Short/Viva-র উত্তর তুমি নিজে মার্ক করবে।"
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Quiz বানাও
              </Button>
            }
          />
        </Card>
      )}

      {quizzes.length > 0 && (
        <Card>
          <CardHeader
            title="Quiz তালিকা"
            subtitle="Chapter-wise quiz — প্রশ্ন যোগ করা, বানানো, মুছে ফেলা"
            icon={ListChecks}
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                নতুন quiz
              </Button>
            }
          />
          <ul className="divide-y divide-ink-100">
            {quizzes.map((quiz) => (
              <li key={quiz.id} className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <Link to={`/quiz/${quiz.id}`} className="text-sm font-semibold text-ink-900 hover:underline">
                    {quiz.title}
                  </Link>
                  <p className="muted mt-0.5">
                    {quiz.subjectName} → Ch {quiz.chapterNumber}: {quiz.chapterName}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <Badge>{quiz.questionCount} টা প্রশ্ন</Badge>
                    {quiz.attemptCount > 0 ? <Badge>{quiz.attemptCount} বার দেওয়া</Badge> : <Badge>এখনো দাওনি</Badge>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link className="btn-ghost" to={`/quiz/${quiz.id}`}>
                    <Play className="h-4 w-4" />
                    খুলো
                  </Link>
                  <button className="btn-ghost" onClick={() => setToDelete(quiz)} aria-label="quiz মুছে ফেলো">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader
          title="দুর্বল topic → revision suggestion"
          subtitle="যে topic-এ আসল প্রশ্নে accuracy ৬০% এর নিচে, শুধু সেগুলো"
          icon={Target}
        />
        <div className="p-4 sm:p-5">
          {loading ? (
            <Spinner />
          ) : (summary?.weakTopics?.length ?? 0) === 0 ? (
            <p className="muted">
              এখন কোনো দুর্বল topic নেই। Quiz দিলে যে topic-গুলোতে ভুল হবে, সেগুলো এখানেই দেখা যাবে — অনুমান করে কিছু
              বলা হবে না।
            </p>
          ) : (
            <ul className="space-y-2">
              {summary.weakTopics.map((topic) => (
                <li key={topic.topicId} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-ink-800">{topic.topicName}</p>
                    <p className="muted">
                      {topic.subjectName} → Ch {topic.chapterNumber} · accuracy {topic.accuracy}%
                    </p>
                  </div>
                  <Link className="btn-ghost shrink-0" to={`/subjects/${topic.subjectId}/chapters/${topic.chapterId}`}>
                    <Sparkles className="h-4 w-4" />
                    chapter খুলো
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="সাম্প্রতিক ফলাফল" subtitle="প্রতিটা attempt-এর স্কোর" icon={BarChart3} />
        <div className="divide-y divide-ink-100">
          {(results?.results?.length ?? 0) === 0 ? (
            <EmptyState title="এখনো quiz দাওনি" description="প্রথম quiz দেওয়ার পরেই এখানে ফলাফল দেখা যাবে।" icon={BarChart3} />
          ) : (
            results.results.map((result) => (
              <div key={result.id} className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{result.quizTitle}</p>
                  <p className="muted">
                    {result.subjectName} → Ch {result.chapterNumber} · {formatDateShort(result.takenAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={result.accuracy >= 60 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}>
                    {result.score}/{result.total} · {result.accuracy}%
                  </Badge>
                  <Link className="btn-ghost" to={`/quiz/results/${result.id}`}>
                    উত্তরপত্র
                  </Link>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {creating && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 sm:items-center sm:p-4">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-4 shadow-xl sm:rounded-2xl sm:p-5" role="dialog" aria-modal="true">
            <h3 className="text-sm font-semibold text-ink-900">নতুন Quiz</h3>
            <div className="mt-3 space-y-3">
              <div>
                <label className="label">কোন chapter-এর quiz</label>
                <select className="input" value={form.chapterId} onChange={(e) => setForm({ ...form, chapterId: e.target.value })}>
                  {chapters.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Quiz-এর নাম *</label>
                <input
                  className="input"
                  autoFocus
                  placeholder="যেমন: Chapter 1 — MQTT ও CoAP"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <p className="muted">Quiz বানানোর পরেই প্রশ্ন যোগ করার স্ক্রিনে নিয়ে যাবে।</p>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setCreating(false)}>
                বাতিল
              </Button>
              <Button onClick={createQuiz} disabled={busy || !form.title.trim() || !form.chapterId}>
                তৈরি করো
              </Button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Quiz মুছে ফেলবে?"
        message={`"${toDelete?.title ?? ''}" আর তার সব attempt হিসাব থেকে চলে যাবে।`}
        confirmLabel="মুছে ফেলো"
        busy={busy}
        onClose={() => setToDelete(null)}
        onConfirm={removeQuiz}
      />
    </div>
  );
}
