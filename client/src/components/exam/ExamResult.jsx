import { useState } from 'react';
import { CheckCircle2, XCircle, MinusCircle, RotateCcw, ListChecks, ChevronDown, Clock } from 'lucide-react';
import { Card, CardHeader, Button, Badge, StatCard } from '../ui/index.jsx';

/**
 * Exam result + question-wise review (Phase 5).
 *
 * The numbers come straight from the server (it graded the exam), so what the
 * student reads here is exactly what was scored. Every question shows the given
 * answer next to the correct one, and the three states are kept apart:
 * correct / wrong / unanswered.
 */
const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

const timeLabel = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds ?? 0));
  const minutes = String(Math.floor(safe / 60)).padStart(2, '0');
  return `${minutes}:${String(safe % 60).padStart(2, '0')}`;
};

const STATUS_META = {
  correct: { label: 'সঠিক', className: 'border-emerald-200 bg-emerald-50 text-emerald-700', icon: CheckCircle2 },
  wrong: { label: 'ভুল', className: 'border-rose-200 bg-rose-50 text-rose-700', icon: XCircle },
  unanswered: { label: 'উত্তর দাওনি', className: 'border-ink-200 bg-ink-50 text-ink-600', icon: MinusCircle },
};

export default function ExamResult({ exam, onRetry, onNewExam, busy }) {
  const [onlyWrong, setOnlyWrong] = useState(false);
  const summary = exam.summary ?? { total: 0, correct: 0, wrong: 0, unanswered: 0, score: 0, percentage: 0 };
  const questions = onlyWrong ? exam.questions.filter((question) => question.status !== 'correct') : exam.questions;

  return (
    <div className="space-y-3">
      <Card>
        <CardHeader
          title="Exam Completed"
          subtitle={exam.scopeLabel}
          icon={ListChecks}
          action={
            <div className="flex gap-2">
              <Button variant="ghost" onClick={onRetry} disabled={busy}>
                <RotateCcw className="mr-1.5 h-4 w-4" />
                আবার exam (Retry)
              </Button>
              <Button variant="ghost" onClick={onNewExam}>
                নতুন exam
              </Button>
            </div>
          }
        />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
          <StatCard label="Total Questions" value={summary.total} />
          <StatCard label="Correct" value={summary.correct} tone="brand" icon={CheckCircle2} />
          <StatCard label="Wrong" value={summary.wrong} icon={XCircle} />
          <StatCard label="Unanswered" value={summary.unanswered} icon={MinusCircle} />
          <StatCard label="Score" value={`${summary.score}/${summary.total}`} />
          <StatCard label="Percentage" value={`${summary.percentage}%`} tone={summary.percentage >= 60 ? 'brand' : 'default'} />
          <StatCard label="Time Taken" value={timeLabel(summary.timeTakenSeconds)} icon={Clock} />
          <StatCard
            label="ফলাফল"
            value={summary.percentage >= 60 ? 'পাস 🎉' : 'আরও পড়া দরকার'}
            hint={summary.percentage >= 60 ? 'ভালো হয়েছে' : 'দুর্বল topic গুলো আবার দেখো'}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title="প্রশ্ন-ভিত্তিক পর্যালোচনা (Question-wise review)"
          subtitle="কোনটা ভুল হয়েছে, সঠিক উত্তর কী — সব এখানে"
          icon={ListChecks}
          action={
            <button
              type="button"
              className={`rounded-xl border px-3 py-1.5 text-xs font-medium ${
                onlyWrong ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white text-ink-600'
              }`}
              onClick={() => setOnlyWrong((value) => !value)}
            >
              {onlyWrong ? 'সব প্রশ্ন দেখাও' : 'শুধু ভুল + বাদ পড়া গুলো'}
            </button>
          }
        />
        <ul className="divide-y divide-ink-100">
          {questions.map((question, index) => {
            const meta = STATUS_META[question.status] ?? STATUS_META.unanswered;
            const Icon = meta.icon;
            return (
              <li key={question.id} className="space-y-2 px-4 py-3 sm:px-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-sm font-medium text-ink-900">
                    {index + 1}. {question.question}
                  </p>
                  <Badge className={meta.className}>
                    <Icon className="h-3 w-3" /> {meta.label}
                  </Badge>
                </div>

                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  {question.options.map((option, optionIndex) => {
                    const isCorrectOption = option === question.answer;
                    const isChosen = option === question.yourAnswer;
                    return (
                      <div
                        key={option}
                        className={`rounded-xl border px-3 py-1.5 ${
                          isCorrectOption
                            ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                            : isChosen
                              ? 'border-rose-300 bg-rose-50 text-rose-700'
                              : 'border-ink-200 bg-white text-ink-600'
                        }`}
                      >
                        <span className="font-medium">{OPTION_LETTERS[optionIndex]}.</span> {option}
                        {isCorrectOption && <span className="ml-1 text-xs">(সঠিক উত্তর)</span>}
                        {isChosen && !isCorrectOption && <span className="ml-1 text-xs">(তুমি দিয়েছ)</span>}
                      </div>
                    );
                  })}
                </div>

                <p className="muted">
                  তোমার উত্তর: <strong>{question.yourAnswer || '(দাওনি)'}</strong> · সঠিক উত্তর:{' '}
                  <strong>{question.answer}</strong>
                  {question.topicName ? ` · topic: ${question.topicName}` : ''}
                  {question.source === 'generated' ? ' · pattern-based প্রশ্ন' : ''}
                </p>
              </li>
            );
          })}
          {!questions.length && (
            <li className="px-4 py-4 text-sm text-ink-600 sm:px-5">
              <ChevronDown className="mr-1 inline h-4 w-4" />
              সব উত্তর সঠিক — ভুল কিছু নেই!
            </li>
          )}
        </ul>
      </Card>
    </div>
  );
}
