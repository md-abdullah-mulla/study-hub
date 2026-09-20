import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, Trophy, Target, TrendingUp, Clock, Trash2, ChevronRight } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, Badge, StatCard, EmptyState, Spinner, ConfirmDialog } from '../components/ui/index.jsx';
import ExamSetup from '../components/exam/ExamSetup.jsx';
import ExamRunner from '../components/exam/ExamRunner.jsx';
import ExamResult from '../components/exam/ExamResult.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { formatDateShort } from '../lib/format.js';

/**
 * Exam Mode (Phase 5).
 *
 * Three states on one page, so the student never loses their place:
 *   setup   → pick the scope and start
 *   running → answer with a timer (auto-submits when the time is over)
 *   result  → score summary + question-wise review + retry
 *
 * Questions are limited to the chosen subject/chapter/topic, and the correct
 * answers only reach the browser after the exam is submitted.
 */
export default function ExamPage() {
  const { subjects, refresh } = useAppData();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pastExams, setPastExams] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeExam, setActiveExam] = useState(null);
  const [result, setResult] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const load = async () => {
    try {
      const data = await api.exams.list();
      setPastExams(data.exams);
      setStats(data.stats);
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

  const startExam = async (request) => {
    setBusy(true);
    setLastRequest(request);
    try {
      const exam = await api.exams.create(request);
      setActiveExam(exam);
      setResult(null);
      if (exam.counts.bank + exam.counts.generated < request.questionCount) {
        toast.info(`এই scope-এ ${exam.questions.length} টা প্রশ্ন পাওয়া গেল`);
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const submitExam = async (answers, timeTakenSeconds) => {
    if (!activeExam) return;
    setBusy(true);
    try {
      const graded = await api.exams.submit(activeExam.id, { answers, timeTakenSeconds });
      setResult(graded);
      setActiveExam(null);
      toast.success(`Exam শেষ — ${graded.summary.correct}/${graded.summary.total} (${graded.summary.percentage}%)`);
      await load();
      await refresh?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const openPastExam = async (examId) => {
    setBusy(true);
    try {
      const exam = await api.exams.get(examId);
      setResult(exam);
      setActiveExam(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeExam = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.exams.remove(toDelete.id);
      toast.success('Exam মুছে ফেলা হলো');
      setToDelete(null);
      if (result?.id === toDelete.id) setResult(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h1 className="text-lg font-semibold text-ink-900">Exam Mode</h1>
          <p className="muted">নির্দিষ্ট subject/chapter/topic থেকে সময় ধরে পরীক্ষার মতো practice</p>
        </div>
        {stats?.totalExams ? (
          <Badge className="border-brand-200 bg-brand-50 text-brand-700">
            এখন পর্যন্ত {stats.totalExams} টা exam · গড় {stats.averagePercentage}%
          </Badge>
        ) : null}
      </div>

      {stats?.totalExams > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="মোট exam" value={stats.totalExams} icon={ListChecks} />
          <StatCard label="গড় স্কোর" value={`${stats.averagePercentage}%`} tone="brand" icon={TrendingUp} />
          <StatCard label="সেরা স্কোর" value={`${stats.best}%`} icon={Trophy} />
          <StatCard
            label="দুর্বল স্কোর"
            value={`${stats.lowest}%`}
            hint={`সঠিক ${stats.totalCorrect} · ভুল ${stats.totalWrong}`}
            icon={Target}
          />
        </div>
      )}

      {activeExam ? (
        <ExamRunner exam={activeExam} onSubmit={submitExam} onCancel={() => setActiveExam(null)} busy={busy} />
      ) : result ? (
        <>
          <ExamResult
            exam={result}
            busy={busy}
            onRetry={() => startExam(lastRequest ?? { subjectId: result.subjectId, chapterId: result.chapterId, topicId: result.topicId, questionCount: result.questionCount, durationMinutes: result.durationMinutes })}
            onNewExam={() => {
              setResult(null);
              setOpenReview(null);
            }}
          />
        </>
      ) : (
        <ExamSetup subjects={subjects} onStart={startExam} busy={busy} />
      )}

      <Card>
        <CardHeader title="আগের exam গুলো" subtitle="স্কোর দেখতে বা আবার পর্যালোচনা করতে চাপো" icon={Clock} />
        {pastExams.length === 0 ? (
          <EmptyState
            icon={ListChecks}
            title="এখনো কোনো exam দাওনি"
            description="উপর থেকে subject/chapter বেছে exam শুরু করো — শেষে স্কোর আর প্রশ্ন-ভিত্তিক পর্যালোচনা পাবে।"
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {pastExams.map((exam) => (
              <li key={exam.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{exam.scopeLabel}</p>
                  <p className="muted">
                    {formatDateShort(exam.submittedAt ?? exam.startedAt)} · {exam.questionCount} প্রশ্ন ·{' '}
                    {exam.durationMinutes} মিনিট
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {exam.status === 'submitted' ? (
                    <Badge
                      className={
                        exam.percentage >= 60
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-rose-200 bg-rose-50 text-rose-700'
                      }
                    >
                      {exam.summary.correct}/{exam.summary.total} · {exam.percentage}%
                    </Badge>
                  ) : (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-800">শুরু করা, জমা দাওনি</Badge>
                  )}
                  {exam.status === 'submitted' && (
                    <button
                      type="button"
                      className="btn-ghost"
                      onClick={() => openPastExam(exam.id)}
                      disabled={busy}
                      aria-label="এই exam-এর পর্যালোচনা দেখো"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn-ghost"
                    onClick={() => setToDelete(exam)}
                    disabled={busy}
                    aria-label="Exam মুছে ফেলো"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <p className="muted text-center">
        প্রশ্ন নিজে লিখে বাড়াতে পারো <Link className="text-brand-600 underline" to="/quiz">Quiz পেজে</Link> — Exam
        তখন নিজে থেকেই সেগুলো ব্যবহার করবে।
      </p>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Exam মুছে ফেলবে?"
        message={`"${toDelete?.scopeLabel ?? ''}" এর এই attempt আর থাকবে না।`}
        confirmLabel="মুছে ফেলো"
        busy={busy}
        onClose={() => setToDelete(null)}
        onConfirm={removeExam}
      />
    </div>
  );
}
