import { Search, Flame, Menu, GraduationCap } from 'lucide-react';
import { useAppData } from '../../state/AppDataContext.jsx';

/** Mobile app bar + desktop page title row (with global search trigger). */
export function TopBar({ title, subtitle, onOpenSearch, onOpenMenu }) {
  const { dashboard } = useAppData();
  const streak = dashboard?.stats?.currentStreak ?? 0;

  return (
    <header className="sticky top-0 z-20 border-b border-ink-200 bg-white/95 backdrop-blur">
      <div className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <button
          onClick={onOpenMenu}
          className="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100 lg:hidden"
          aria-label="মেনু"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 lg:hidden">
          <span className="rounded-lg bg-brand-600 p-1.5 text-white">
            <GraduationCap className="h-4 w-4" />
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="truncate text-base font-semibold text-ink-900 sm:text-lg">{title}</h1>
          {subtitle && <p className="muted truncate">{subtitle}</p>}
        </div>

        {streak > 0 && (
          <span className="hidden items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 sm:inline-flex">
            <Flame className="h-3.5 w-3.5" />
            {streak} দিন
          </span>
        )}

        <button
          onClick={onOpenSearch}
          className="rounded-xl border border-ink-200 p-2 text-ink-500 hover:bg-ink-50"
          aria-label="Search"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
