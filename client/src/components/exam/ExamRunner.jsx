import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, Flag, Send, AlertCircle, Sparkles } from 'lucide-react';
import { Card, Button, Badge, ConfirmDialog } from '../ui/index.jsx';

/**
 * Running an exam (Phase 5).
 *
 * Exam rules that are visible on this screen:
 *  - one question at a time, with Previous / Next and a clickable question map
 *  - a real countdown; when it reaches 0:00 the exam is submitted automatically
 *  - answered / unanswered are counted live, and the student sees the count
 *    before submitting
 *  - "পরে করব" marks a question to come back to (flag), which is different from
 *    answering it
 */
const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

const formatClock = (totalSeconds) => {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  const seconds = String(safe % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
};

export default function ExamRunner({ exam, onSubmit, onCancel, busy }) {
  const [answers, setAnswers] = useState({});
  const [flags, setFlags] = useState({});
  const [index, setIndex] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(exam.durationMinutes * 60);

  const questions = exam.questions;
  const question = questions[index];

  const answeredCount = useMemo(
    () => questions.filter((entry) => String(answers[entry.id] ?? '').trim() !== '').length,
    [questions, answers]
  );
  const unansweredCount = questions.length - answeredCount;

  // countdown — the exam submits itself when the time is over
  useEffect(() => {
    if (busy) return undefined;
    const started = Date.now();
    const initial = secondsLeft;
    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - started) / 1000);
      const left = initial - elapsed;
      setSecondsLeft(left);
      if (left <= 0) {
        clearInterval(timer);
        onSubmit(answers, initial);
      }
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);

  const setAnswer = (value) => setAnswers((current) => ({ ...current, [question.id]: value }));

  if (!question) return null;

  const answered = String(answers[question.id] ?? '').trim() !== '';
  const lowTime = secondsLeft <= 60;

  return (
    <div className="space-y-3">
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{exam.title}</p>
            <p className="muted">
              প্রশ্ন {index + 1} / {questions.length} · উত্তর দিয়েছ {answeredCount} টা · বাকি {unansweredCount} টা
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-sm font-semibold ${
              lowTime ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-ink-200 bg-ink-50 text-ink-700'
            }`}
            aria-label="বাকি সময়"
          >
            <Clock className="h-4 w-4" />
            {formatClock(secondsLeft)}
          </div>
        </div>

        {/* question map — every number is a jump button */}
        <div className="flex flex-wrap gap-1.5 border-t border-ink-100 px-4 py-3 sm:px-5">
          {questions.map((entry, entryIndex) => {
            const isAnswered = String(answers[entry.id] ?? '').trim() !== '';
            const isCurrent = entryIndex === index;
            const isFlagged = Boolean(flags[entry.id]);
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => setIndex(entryIndex)}
                aria-label={`প্রশ্ন ${entryIndex + 1}`}
                className={`h-8 w-8 rounded-lg border text-xs font-semibold ${
                  isCurrent
                    ? 'border-brand-400 bg-brand-500 text-white'
                    : isAnswered
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : isFlagged
                        ? 'border-amber-300 bg-amber-50 text-amber-700'
                        : 'border-ink-200 bg-white text-ink-500'
                }`}
              >
                {entryIndex + 1}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="space-y-3 p-4 sm:p-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge>{question.type === 'true_false' ? 'সত্য/মিথ্যা' : 'MCQ'}</Badge>
            {question.topicName && <Badge className="border-ink-200 bg-ink-50 text-ink-600">{question.topicName}</Badge>}
            {question.source === 'generated' ? (
              <Badge className="border-amber-200 bg-amber-50 text-amber-800">
                <Sparkles className="h-3 w-3" /> pattern-based প্রশ্ন — উত্তর মিলিয়ে নিও
              </Badge>
            ) : (
              <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">নিজের প্রশ্ন ব্যাংক</Badge>
            )}
            {flags[question.id] && (
              <Badge className="border-amber-300 bg-amber-50 text-amber-800">
                <Flag className="h-3 w-3" /> পরে করব
              </Badge>
            )}
          </div>

          <p className="text-sm font-medium text-ink-900">
            {index + 1}. {question.question}
          </p>

          <div className="space-y-1.5">
            {question.options.map((option, optionIndex) => {
              const checked = answers[question.id] === option;
              return (
                <label
                  key={option}
                  className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                    checked ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'
                  }`}
                >
                  <input type="radio" name={`exam-q-${question.id}`} checked={checked} onChange={() => setAnswer(option)} />
                  <span className="font-medium text-ink-500">{OPTION_LETTERS[optionIndex]}.</span>
                  <span>{option}</span>
                </label>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="ghost" onClick={() => setIndex((value) => Math.max(0, value - 1))} disabled={index === 0}>
              <ChevronLeft className="mr-1 h-4 w-4" />
              আগের প্রশ্ন
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={index === questions.length - 1}
            >
              পরের প্রশ্ন
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFlags((current) => ({ ...current, [question.id]: !current[question.id] }))}
            >
              <Flag className="mr-1.5 h-4 w-4" />
              {flags[question.id] ? 'ফ্ল্যাগ সরাও' : 'পরে করব'}
            </Button>
            {answered && (
              <Button
                variant="ghost"
                onClick={() => setAnswers((current) => ({ ...current, [question.id]: '' }))}
                aria-label="উত্তর মুছে ফেলো"
              >
                উত্তর মুছে ফেলো
              </Button>
            )}
          </div>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setConfirmOpen(true)} disabled={busy}>
          <Send className="mr-1.5 h-4 w-4" />
          Exam জমা দাও
        </Button>
        <Button variant="ghost" onClick={onCancel} disabled={busy}>
          বাতিল (exam থেকে বেরিয়ে যাও)
        </Button>
        {unansweredCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-amber-700">
            <AlertCircle className="h-3.5 w-3.5" />
            {unansweredCount} টা প্রশ্নের উত্তর এখনো দাওনি — সেগুলো ভুল নয়, "উত্তর দাওনি" হিসেবে গণ্য হবে।
          </span>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Exam জমা দেবে?"
        message={`${answeredCount} টার উত্তর দিয়েছ, ${unansweredCount} টা খালি আছে। জমা দিলে আর বদলানো যাবে না।`}
        confirmLabel="হ্যাঁ, জমা দাও"
        busy={busy}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onSubmit(answers, exam.durationMinutes * 60 - secondsLeft)}
      />
    </div>
  );
}
