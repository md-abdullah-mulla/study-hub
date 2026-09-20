import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, RotateCcw, CheckCircle2, XCircle, MinusCircle, Sparkles } from 'lucide-react';
import { Card, CardHeader, Button, Badge, StatCard } from '../ui/index.jsx';
import { isAutoGraded } from '../../lib/quiz.js';
import { api } from '../../api/client.js';
import { useToast } from '../../state/ToastContext.jsx';

/**
 * Result review (Phase 3).
 *
 * Shows the right answer next to the student's own, and — for short/viva —
 * lets the student mark each written answer (সঠিক / আংশিক / ভুল). Those marks
 * are what the score uses; the app never pretends to grade free text.
 *
 * Weak topics come from the attempt itself and each one has a "revision দরকার"
 * button that reuses the existing topic status API, so the revision system and
 * the quiz system stay in step.
 */
const SELF_MARKS = [
  { value: 1, label: 'সঠিক', tone: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 0.5, label: 'আংশিক', tone: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 0, label: 'ভুল', tone: 'border-red-300 bg-red-50 text-red-700' },
];

export default function QuizReview({ result, onChange }) {
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);

  // `result` arrives in two shapes: the response of POST /attempt (id nested in
  // `.result`) and the saved attempt from GET /quiz-results/:id (id at top level).
  const resultId = result.id ?? result.result?.id;

  const review = (result.review ?? []).map((row) => ({
    ...row,
    autoGraded: row.autoGraded ?? isAutoGraded(row.type),
  }));
  const unmarked = review.filter((row) => !row.autoGraded && !row.selfGraded);

  const markWritten = async (questionId, selfScore) => {
    setBusyId(questionId);
    try {
      const updated = await api.quizResults.selfMark(resultId, [{ questionId, selfScore }]);
      toast.success(`নিজের মার্ক সেভ হলো — এখন ${updated.result.score}/${updated.result.total} (${updated.result.accuracy}%)`);
      onChange?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const sendToRevision = async (topicId, topicName) => {
    setBusyId(`rev-${topicId}`);
    try {
      await api.topics.setStatus(topicId, 'needs_revision');
      toast.success(`"${topicName}" revision তালিকায় যোগ হলো`);
      onChange?.();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusyId(null);
    }
  };

  const weakTopics = result.weakTopics ?? [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="স্কোর" value={`${result.score}/${result.total}`} tone="brand" />
        <StatCard label="Accuracy" value={`${result.accuracy}%`} />
        <StatCard label="দুর্বল topic" value={weakTopics.length} tone={weakTopics.length ? 'warn' : 'success'} />
        <StatCard label="নিজে মার্ক বাকি" value={unmarked.length} hint={unmarked.length ? 'Short/Viva' : 'সব হয়ে গেছে'} />
      </div>

      {unmarked.length > 0 && (
        <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            {unmarked.length} টা লেখা উত্তরে নিজের মার্ক দেওয়া হয়নি — তাই ওগুলো এখন <strong>০ ধরা হয়েছে</strong>।
            নিচে উত্তর মিলিয়ে সঠিক / আংশিক / ভুল বেছে নিলে স্কোর সত্যিটা দেখাবে।
          </p>
        </div>
      )}

      {weakTopics.length > 0 && (
        <Card>
          <CardHeader
            title="দুর্বল topic (মাপা, অনুমান নয়)"
            subtitle="এই topic-গুলোতে accuracy ৬০% এর নিচে — revision-এ দিয়ে দিতে পারো"
            icon={Sparkles}
          />
          <ul className="divide-y divide-ink-100">
            {weakTopics.map((topic) => (
              <li key={topic.topicId} className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{topic.topicName}</p>
                  <p className="muted">{topic.answered} টা প্রশ্ন · accuracy {topic.accuracy}%</p>
                </div>
                <Button
                  variant="ghost"
                  className="shrink-0"
                  disabled={busyId === `rev-${topic.topicId}`}
                  onClick={() => sendToRevision(topic.topicId, topic.topicName)}
                >
                  <RotateCcw className="h-4 w-4" />
                  revision দরকার
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader title="উত্তরপত্র" subtitle="তোমার উত্তর বনাম সঠিক উত্তর" icon={CheckCircle2} />
        <ul className="divide-y divide-ink-100">
          {review.map((row, index) => (
            <li key={row.questionId} className="space-y-2 p-4 sm:p-5">
              <div className="flex items-start gap-2">
                <span className="mt-0.5 shrink-0">
                  {row.autoGraded ? (
                    row.isCorrect ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )
                  ) : (
                    <MinusCircle className="h-4 w-4 text-amber-500" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-ink-900">
                    {index + 1}. {row.question}
                  </p>
                  <p className="muted">{row.typeLabel}</p>

                  <div className="mt-1.5 space-y-1 text-sm">
                    <p className="text-ink-700">
                      <span className="muted">তোমার উত্তর: </span>
                      {row.yourAnswer ? row.yourAnswer : <span className="text-ink-400">(দাওনি)</span>}
                    </p>
                    {row.correctAnswer && (
                      <p className="text-emerald-700">
                        <span className="muted">সঠিক উত্তর: </span>
                        {row.correctAnswer}
                      </p>
                    )}
                    {row.explanation && <p className="text-ink-600">💡 {row.explanation}</p>}
                  </div>

                  {!row.autoGraded && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className="muted">নিজের মার্ক:</span>
                      {SELF_MARKS.map((mark) => (
                        <button
                          key={mark.value}
                          type="button"
                          disabled={busyId === row.questionId}
                          onClick={() => markWritten(row.questionId, mark.value)}
                          className={`chip border ${mark.tone} ${
                            row.selfGraded && row.awarded === mark.value ? 'ring-2 ring-offset-1' : ''
                          }`}
                        >
                          {mark.label}
                          {row.selfGraded && row.awarded === mark.value ? ' ✓' : ''}
                        </button>
                      ))}
                      {row.selfGraded && <Badge>{row.awarded} point</Badge>}
                    </div>
                  )}
                </div>
                <Badge className="shrink-0">{row.awarded}/1</Badge>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <p className="muted">
        ভুল মানে ব্যর্থতা নয় — কোন concept-টা আবার দেখা দরকার, সেটার ঠিকানা। উপরের দুর্বল topic গুলোতে “revision দরকার”
        চাপলে সেগুলো Revision পেজে চলে যাবে, আর Dashboard-এর recommendation-ও সেগুলো আগে ধরবে।
      </p>

      <div className="flex flex-wrap gap-2">
        <Link className="btn-ghost" to="/revision">
          Revision পেজে যাও
        </Link>
        <Link className="btn-ghost" to="/quiz">
          Quiz list-এ ফিরে যাও
        </Link>
      </div>
    </div>
  );
}
