import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '../ui/index.jsx';
import { REVISION_STAGE_LABEL } from '../../lib/status.js';

/** Topics waiting for revision (spec §14). Overdue items are shown first. */
export function RevisionDueCard({ items }) {
  return (
    <Card>
      <CardHeader
        title="Revision Due"
        subtitle={items.length ? 'এগুলো আগে revise করলে মনে থাকবে' : undefined}
        icon={RefreshCw}
        action={
          items.length > 0 ? (
            <Link to="/revision" className="text-xs font-medium text-brand-600 hover:underline">
              সব দেখুন
            </Link>
          ) : null
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="এখন কোনো revision বাকি নেই"
          description="Topic complete করলে ৩ দিন পরে প্রথম revision আসবে।"
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.topicId} className="px-4 py-3 sm:px-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-ink-900">{item.topicName}</div>
                  <div className="muted mt-0.5 truncate">
                    {item.subjectName} · Chapter {item.chapterNumber}: {item.chapterName}
                  </div>
                </div>
                <span className="chip shrink-0 bg-rose-50 text-rose-600">
                  {item.overdueDays > 0 ? `${item.overdueDays} দিন দেরি` : 'আজ'}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="chip bg-ink-100 text-ink-600">
                  {REVISION_STAGE_LABEL[item.stage]}
                </span>
                <Link
                  to={`/subjects/${item.subjectId}/chapters/${item.chapterId}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  খুলুন
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
