import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Play, Plus, Trash2, ListChecks } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, Button, Badge, EmptyState, Spinner, ConfirmDialog } from '../components/ui/index.jsx';
import QuestionFormModal from '../components/quiz/QuestionFormModal.jsx';
import QuizRunner from '../components/quiz/QuizRunner.jsx';
import QuizReview from '../components/quiz/QuizReview.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { QUESTION_TYPE_LABELS, normalizeAttempt } from '../lib/quiz.js';

/**
 * One quiz: its questions (add / edit / delete) and taking it (Phase 3).
 *
 * While questions are being edited the answers are visible — that is the
 * teacher view. The moment a quiz is started, the app re-fetches the questions
 * WITHOUT the answers, so the attempt screen cannot show them.
 */
export default function QuizDetailPage() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { subjects } = useAppData();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState('manage'); // manage | take | review
  const [attemptQuiz, setAttemptQuiz] = useState(null);
  const [result, setResult] = useState(null);
  const [questionModal, setQuestionModal] = useState({ open: false, question: null });
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      // withAnswers: the manage screen shows the correct answer next to each question
      const data = await api.quizzes.get(quizId, { withAnswers: true });
      setQuiz(data);
    } catch (error) {
      toast.error(error.message);
      navigate('/quiz');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quizId]);

  const chapterTopics = useMemo(() => {
    if (!quiz) return [];
    for (const subject of subjects) {
      const chapter = subject.chapters.find((c) => c.id === quiz.chapterId);
      if (chapter) return chapter.topics;
    }
    return [];
  }, [quiz, subjects]);

  const saveQuestion = async (payload) => {
    setBusy(true);
    try {
      if (questionModal.question) {
        await api.quizzes.updateQuestion(quizId, questionModal.question.id, payload);
        toast.success('প্রশ্ন আপডেট হলো');
      } else {
        await api.quizzes.addQuestion(quizId, payload);
        toast.success('প্রশ্ন যোগ হলো');
      }
      setQuestionModal({ open: false, question: null });
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeQuestion = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.quizzes.removeQuestion(quizId, toDelete.id);
      toast.success('প্রশ্ন মুছে ফেলা হলো');
      setToDelete(null);
      await load();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const startAttempt = async () => {
    setBusy(true);
    try {
      // re-fetch right before taking: this payload has no answers in it at all
      const fresh = await api.quizzes.get(quizId);
      setAttemptQuiz({ ...fresh, questions: fresh.questions.map((q) => ({ ...q, typeLabel: QUESTION_TYPE_LABELS[q.type] })) });
      setMode('take');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const submitAttempt = async (answers) => {
    setBusy(true);
    try {
      const outcome = await api.quizzes.attempt(quizId, answers);
      // one flat attempt object with its id at the top, review rows labelled
      setResult(normalizeAttempt(outcome));
      setMode('review');
      toast.success(`স্কোর ${outcome.result.score}/${outcome.result.total} (${outcome.result.accuracy}%)`);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;
  if (!quiz) return null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <Link to="/quiz" className="muted inline-flex items-center gap-1 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quiz তালিকা
          </Link>
          <h1 className="text-lg font-semibold text-ink-900">{quiz.title}</h1>
          <p className="muted">
            {quiz.subjectName} → Ch {quiz.chapterNumber}: {quiz.chapterName} · {quiz.questionCount} টা প্রশ্ন
          </p>
        </div>
        {mode === 'manage' && (
          <div className="flex gap-2">
            <Button disabled={busy || quiz.questionCount === 0} onClick={startAttempt}>
              <Play className="mr-1.5 h-4 w-4" />
              Quiz দাও
            </Button>
            <Button variant="ghost" onClick={() => setQuestionModal({ open: true, question: null })}>
              <Plus className="mr-1.5 h-4 w-4" />
              প্রশ্ন যোগ করো
            </Button>
          </div>
        )}
      </div>

      {mode === 'take' && attemptQuiz && (
        <Card>
          <CardHeader title="প্রশ্নের উত্তর দাও" subtitle="উত্তর দিয়ে জমা দিলেই স্কোর দেখতে পাবে" icon={ListChecks} />
          <div className="p-4 sm:p-5">
            <QuizRunner quiz={attemptQuiz} onSubmit={submitAttempt} busy={busy} onCancel={() => setMode('manage')} />
          </div>
        </Card>
      )}

      {mode === 'review' && result && (
        <QuizReview
          result={result}
          onChange={async () => {
            const updated = await api.quizResults.get(result.id);
            setResult(updated);
          }}
        />
      )}

      {mode === 'manage' && (
        <Card>
          <CardHeader title="প্রশ্ন তালিকা" subtitle="এখানে সঠিক উত্তর দেখা যায় — quiz শুরু করলেই লুকিয়ে যাবে" icon={ListChecks} />
          {(quiz.questions.length ?? 0) === 0 ? (
            <EmptyState
              icon={ListChecks}
              title="কোনো প্রশ্ন নেই"
              description="MCQ, সত্য/মিথ্যা, সংক্ষিপ্ত বা Viva — যেকোনো ধরনের প্রশ্ন যোগ করো। অন্তত একটা প্রশ্ন থাকলে quiz দেওয়া যাবে।"
              action={
                <Button onClick={() => setQuestionModal({ open: true, question: null })}>
                  <Plus className="mr-1.5 h-4 w-4" />
                  প্রথম প্রশ্ন যোগ করো
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-ink-100">
              {quiz.questions.map((question, index) => (
                <li key={question.id} className="p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink-900">
                        {index + 1}. {question.question}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Badge>{QUESTION_TYPE_LABELS[question.type] ?? question.type}</Badge>
                        {question.topicName ? <Badge>{question.topicName}</Badge> : null}
                        {question.type === 'short' || question.type === 'viva' ? <Badge>নিজে মার্ক করবে</Badge> : <Badge>auto-graded</Badge>}
                      </div>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button className="btn-ghost" onClick={() => setQuestionModal({ open: true, question })} aria-label="প্রশ্ন edit">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button className="btn-ghost" onClick={() => setToDelete(question)} aria-label="প্রশ্ন মুছে ফেলো">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {question.options?.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {question.options.map((option) => (
                        <li key={option} className="text-sm text-ink-600">
                          {option === question.correctAnswer ? '✅ ' : '• '}
                          {option}
                        </li>
                      ))}
                    </ul>
                  )}
                  {!question.options?.length && question.correctAnswer && (
                    <p className="mt-2 text-sm text-emerald-700">মডেল উত্তর: {question.correctAnswer}</p>
                  )}
                  {question.explanation && <p className="muted mt-1">💡 {question.explanation}</p>}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}

      {mode === 'manage' && quiz.results?.length > 0 && (
        <Card>
          <CardHeader title="এই quiz-এর আগের ফলাফল" subtitle="সবচেয়ে নতুন আগে" icon={ListChecks} />
          <ul className="divide-y divide-ink-100">
            {quiz.results.map((row) => (
              <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <span className="text-sm text-ink-700">
                  {row.score}/{row.total} · {row.accuracy}%
                </span>
                <Link className="btn-ghost" to={`/quiz/results/${row.id}`}>
                  উত্তরপত্র
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <QuestionFormModal
        open={questionModal.open}
        question={questionModal.question}
        topics={chapterTopics}
        busy={busy}
        onClose={() => setQuestionModal({ open: false, question: null })}
        onSubmit={saveQuestion}
      />

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="প্রশ্ন মুছে ফেলবে?"
        message="প্রশ্নটা মুছে গেলে পুরোনো attempt-এর হিসাবও বদলে যাবে।"
        confirmLabel="মুছে ফেলো"
        busy={busy}
        onClose={() => setToDelete(null)}
        onConfirm={removeQuestion}
      />
    </div>
  );
}
