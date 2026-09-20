import { Link } from 'react-router-dom';
import { NAV_ITEMS } from '../components/layout/navItems.js';
import { Card, CardHeader } from '../components/ui/index.jsx';
import { LayoutGrid } from 'lucide-react';

/** Mobile "আরও" hub: everything that does not fit in the bottom nav. */
export default function MorePage() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title="সব ফিচার" subtitle="যেকোনো জায়গায় যাওয়ার শর্টকাট" icon={LayoutGrid} />
        <div className="grid grid-cols-2 gap-2 p-4 sm:grid-cols-3 sm:p-5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-3 text-sm text-ink-700 hover:bg-ink-50"
            >
              <item.icon className="h-4 w-4 text-ink-500" />
              <span className="flex-1">{item.label}</span>
              {item.phase > 1 && (
                <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] text-ink-500">P{item.phase}</span>
              )}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
