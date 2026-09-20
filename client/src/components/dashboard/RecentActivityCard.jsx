import { Activity } from 'lucide-react';
import { Card, CardHeader, EmptyState } from '../ui/index.jsx';
import { formatDateShort } from '../../lib/format.js';

/** Plain-language history of what you actually did (spec §9). */
export function RecentActivityCard({ items }) {
  return (
    <Card>
      <CardHeader title="Recent Activity" icon={Activity} />
      {items.length === 0 ? (
        <EmptyState icon={Activity} title="এখনো কিছু করা হয়নি" description="Topic-এর status বদলালে এখানে দেখা যাবে।" />
      ) : (
        <ul className="divide-y divide-ink-100">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-2.5 sm:px-5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-ink-700">{item.message}</p>
                <p className="muted mt-0.5">{formatDateShort(item.createdAt)}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
