import { Link } from 'react-router-dom';
import { Compass, ArrowRight, CheckCircle2, Info } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '../ui/index.jsx';

/**
 * SMART RECOMMENDATION (spec §10)
 * Shows WHAT to study next and — importantly — WHY, using the reasons the
 * backend produced from real data (completion, idle days, revision due...).
 */
export function RecommendationCard({ recommendation }) {
  if (!recommendation) {
    return (
      <Card>
        <CardHeader title="Recommended Next Study" icon={Compass} />
        <EmptyState
          icon={CheckCircle2}
          title="সব subject 100% complete 🎉"
          description="এখন revision আর quiz-এ মন দাও। নতুন chapter যোগ করলে suggestion আবার আসবে।"
        />
      </Card>
    );
  }

  const r = recommendation;
  const link = r.chapterId ? `/subjects/${r.subjectId}/chapters/${r.chapterId}` : `/subjects/${r.subjectId}`;
  const isRevision = r.kind === 'revision';

  return (
    <Card className="overflow-hidden">
      <CardHeader
        title="Recommended Next Study"
        subtitle="তোমার data থেকে হিসাব করা — নিচে কারণ দেওয়া আছে"
        icon={Compass}
      />

      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3">
          <span
            className="mt-1 h-3 w-3 shrink-0 rounded-full"
            style={{ backgroundColor: r.subjectColor }}
          />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-wide text-ink-500">
              {isRevision ? 'Revision দরকার' : 'পড়া শুরু করুন'}
            </div>
            <h3 className="mt-0.5 text-base font-semibold text-ink-900">{r.subjectName}</h3>
            {r.chapterName ? (
              <p className="mt-0.5 text-sm text-ink-600">
                Chapter {r.chapterNumber}: {r.chapterName}
                {r.chapterPercent !== null && r.chapterPercent !== undefined && (
                  <span className="text-ink-400"> · {r.chapterPercent}% শেষ</span>
                )}
              </p>
            ) : (
              <p className="mt-0.5 text-sm text-ink-600">Subject-এ কোনো chapter নেই</p>
            )}
            {r.kind === 'add_topics' && (
              <p className="mt-1 text-sm text-amber-700">
                এই chapter-এ topic যোগ করলে progress হিসাব শুরু হবে।
              </p>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50 p-3">
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-ink-700">
            <Info className="h-3.5 w-3.5" /> Why this is recommended?
          </div>
          <ul className="space-y-1">
            {r.reasons.map((reason) => (
              <li key={reason.label} className="flex items-center justify-between gap-3 text-xs">
                <span className="text-ink-600">• {reason.label}</span>
                <span className="font-medium text-ink-800">{reason.value}</span>
              </li>
            ))}
          </ul>
        </div>

        {r.runnerUp && (
          <p className="muted mt-3">
            দ্বিতীয় প্রায়োরিটি: {r.runnerUp.subjectName} ({r.runnerUp.percent}%)
          </p>
        )}

        <Link to={link} className="btn-primary mt-4 w-full sm:w-auto">
          {r.chapterName ? 'Chapter খুলুন' : 'Subject খুলুন'} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </Card>
  );
}
