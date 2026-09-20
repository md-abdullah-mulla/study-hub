import { Link } from 'react-router-dom';
import { ArrowRight, TrendingUp } from 'lucide-react';
import { Card, StatCard } from '../ui/index.jsx';
import { Donut } from '../ui/ProgressBar.jsx';
import { minutesLabel } from '../../lib/format.js';

/**
 * The first thing the dashboard shows (spec §32):
 * overall semester progress + the few numbers that actually matter today.
 */
export function OverallProgressCard({ overall, stats }) {
  return (
    <Card className="overflow-hidden">
      <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[auto,1fr] lg:items-center">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center sm:gap-6 lg:flex-col lg:items-center">
          <Donut value={overall.percent} size={150}>
            <span className="text-3xl font-semibold text-ink-900">{overall.percent}%</span>
            <span className="muted mt-0.5">Semester শেষ</span>
          </Donut>

          <div className="text-center lg:text-center">
            <div className="text-sm font-medium text-ink-700">
              {overall.completedTopics} / {overall.totalTopics} topic complete
            </div>
            <div className="muted mt-0.5">
              {overall.remainingTopics} topic বাকি · {overall.completedChapters}/{overall.totalChapters} chapter শেষ
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-2">
          <StatCard label="Total Subject" value={overall.totalSubjects} icon={TrendingUp} />
          <StatCard label="Total Chapter" value={overall.totalChapters} hint={`${overall.completedChapters}টি শেষ`} />
          <StatCard label="Complete Topic" value={overall.completedTopics} tone="success" hint={`${overall.totalTopics}টির মধ্যে`} />
          <StatCard label="Revision Due" value={overall.revisionDueCount} tone={overall.revisionDueCount ? 'warn' : 'default'} />
          <StatCard label="মোট Study Time" value={minutesLabel(stats.totalStudyMinutes)} hint="Phase 2-এ timer আসছে" />
          <StatCard label="Study Streak" value={`${stats.currentStreak} দিন`} hint={`সেরা: ${stats.longestStreak} দিন`} />
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-ink-100 bg-ink-50/60 px-4 py-2.5 sm:px-5">
        <span className="muted">প্রতিটি percentage topic status থেকে automatically হিসাব হয় — হাতে বসানো নয়।</span>
        <Link to="/subjects" className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">
          Subject দেখুন <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </Card>
  );
}
