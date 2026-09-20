import { Link } from 'react-router-dom';
import { AlertCircle, CalendarClock } from 'lucide-react';
import { Card, CardHeader } from '../ui/index.jsx';
import { ProgressBar } from '../ui/ProgressBar.jsx';
import { relativeDays, daysSince } from '../../lib/format.js';
import { Library } from 'lucide-react';

/** Subject-wise progress with click-through to the subject page (spec §9). */
export function SubjectProgressList({ subjects }) {
  const sorted = [...subjects].sort((a, b) => a.progress.percent - b.progress.percent);

  return (
    <Card>
      <CardHeader
        title="Subject Progress"
        subtitle="কম progress আগে দেখানো হয়েছে"
        icon={Library}
        action={
          <Link to="/subjects" className="text-xs font-medium text-brand-600 hover:underline">
            সব দেখুন
          </Link>
        }
      />
      <div className="divide-y divide-ink-100">
        {sorted.map((subject) => (
          <Link
            key={subject.id}
            to={`/subjects/${subject.id}`}
            className="block px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="truncate text-sm font-medium text-ink-900">{subject.name}</span>
                </div>
                <div className="muted mt-0.5 flex flex-wrap items-center gap-x-2">
                  <span>
                    {subject.progress.completed}/{subject.progress.total} topic
                  </span>
                  <span>·</span>
                  <span>
                    {subject.completedChapters}/{subject.chapterCount} chapter
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarClock className="h-3 w-3" />
                    {subject.lastStudiedAt ? relativeDays(daysSince(subject.lastStudiedAt)) : 'পড়া হয়নি'}
                  </span>
                  {subject.revisionDueCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <AlertCircle className="h-3 w-3" />
                      {subject.revisionDueCount} revision due
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink-900">
                {subject.progress.percent}%
              </span>
            </div>
            <div className="mt-2">
              <ProgressBar value={subject.progress.percent} color={subject.color} size="sm" />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
