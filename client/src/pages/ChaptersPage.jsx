import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListTree, Search, ChevronRight } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '../components/ui/index.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { useAppData } from '../state/AppDataContext.jsx';

/**
 * All chapters of the semester in one list (spec §25: "Chapters" screen).
 * Useful when you want to jump straight to a chapter without going subject-first.
 */
export default function ChaptersPage() {
  const { subjects } = useAppData();
  const [query, setQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [onlyPending, setOnlyPending] = useState(false);

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return subjects
      .filter((s) => subjectFilter === 'all' || s.id === Number(subjectFilter))
      .flatMap((subject) =>
        subject.chapters.map((chapter) => ({ subject, chapter }))
      )
      .filter(({ chapter }) => {
        if (onlyPending && chapter.progress.percent === 100) return false;
        if (!term) return true;
        return (
          chapter.name.toLowerCase().includes(term) ||
          (chapter.nameBn ?? '').toLowerCase().includes(term) ||
          `chapter ${chapter.number}`.includes(term)
        );
      });
  }, [subjects, query, subjectFilter, onlyPending]);

  const totalChapters = subjects.reduce((n, s) => n + s.chapters.length, 0);
  const completedChapters = subjects.reduce(
    (n, s) => n + s.chapters.filter((c) => c.progress.total > 0 && c.progress.percent === 100).length,
    0
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Chapter & Topic"
          subtitle={`${completedChapters}/${totalChapters} chapter complete`}
          icon={ListTree}
        />

        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-ink-200 px-3 py-2">
            <Search className="h-4 w-4 text-ink-400" />
            <input
              className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
              placeholder="Chapter খুঁজুন..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <select
            className="input sm:w-56"
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
          >
            <option value="all">সব subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-xs text-ink-600">
            <input
              type="checkbox"
              checked={onlyPending}
              onChange={(e) => setOnlyPending(e.target.checked)}
              className="h-4 w-4 rounded border-ink-300"
            />
            শুধু বাকিগুলো
          </label>
        </div>

        {rows.length === 0 ? (
          <EmptyState icon={ListTree} title="কোনো chapter মেলেনি" description="Filter বদলে আবার দেখুন।" />
        ) : (
          <ul className="divide-y divide-ink-100">
            {rows.map(({ subject, chapter }) => (
              <li key={chapter.id}>
                <Link
                  to={`/subjects/${subject.id}/chapters/${chapter.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-semibold text-white"
                    style={{ backgroundColor: subject.color }}
                  >
                    {chapter.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-ink-900">{chapter.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink-700">
                        {chapter.progress.percent}%
                      </span>
                    </div>
                    <div className="muted mt-0.5">
                      {subject.name} · {chapter.progress.completed}/{chapter.progress.total} topic
                      {chapter.progress.total === 0 && ' · topic যোগ করুন'}
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={chapter.progress.percent} color={subject.color} size="sm" />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
