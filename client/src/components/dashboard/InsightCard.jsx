import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, TrendingUp, ArrowRight } from 'lucide-react';
import { Card, CardHeader, Badge } from '../ui/index.jsx';
import { api } from '../../api/client.js';

/**
 * Dashboard performance strip (Phase 5).
 *
 * The dashboard stays short, so this card shows only what the student can act on
 * right now: two numbers (accuracy, exam average) and the top insights the
 * analytics service derived from real answers. Everything deep lives on the
 * Analytics page — this card is the pointer to it.
 */
export default function InsightCard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    api
      .advancedAnalytics()
      .then((payload) => {
        if (!cancelled) setData(payload);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error || !data) return null;

  const { totals, insights, streak } = data;
  const hasAnswers = totals.questionsAnswered + totals.examQuestions > 0;

  return (
    <Card>
      <CardHeader
        title="আজকের insight"
        subtitle="তোমার আসল উত্তর আর পড়ার সময় থেকে হিসাব করা"
        icon={Lightbulb}
        action={
          <Link to="/analytics" className="btn-ghost text-xs">
            পুরো report
            <ArrowRight className="ml-1 h-3.5 w-3.5" />
          </Link>
        }
      />
      <div className="space-y-3 p-4 sm:p-5">
        <div className="flex flex-wrap gap-2">
          <Badge className="border-brand-200 bg-brand-50 text-brand-700">
            <TrendingUp className="h-3 w-3" />
            {hasAnswers ? `accuracy ${totals.perQuestionAccuracy}%` : 'accuracy — এখনো প্রশ্ন দাওনি'}
          </Badge>
          {totals.exams > 0 && <Badge>exam গড় {totals.averageExamScore}%</Badge>}
          <Badge>{totals.topicsCompleted}/{totals.topics} topic complete</Badge>
          <Badge className={streak.current > 0 ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : ''}>
            {streak.current} দিনের streak
          </Badge>
        </div>

        <ul className="space-y-1.5">
          {insights.slice(0, 3).map((insight) => (
            <li key={insight} className="rounded-xl border border-ink-100 bg-ink-50/60 px-3 py-2 text-sm text-ink-700">
              {insight}
            </li>
          ))}
        </ul>
      </div>
    </Card>
  );
}
