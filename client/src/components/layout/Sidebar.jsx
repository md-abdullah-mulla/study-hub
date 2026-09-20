import { NavLink } from 'react-router-dom';
import { GraduationCap, Sparkles } from 'lucide-react';
import { NAV_ITEMS } from './navItems.js';
import { useAppData } from '../../state/AppDataContext.jsx';

/** Desktop sidebar with the overall progress summary at the bottom. */
export function Sidebar({ onOpenSearch }) {
  const { semester, dashboard } = useAppData();
  const percent = semester?.progress?.percent ?? 0;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-ink-200 bg-white lg:flex">
      <div className="flex items-center gap-2.5 px-5 py-4">
        <span className="rounded-xl bg-brand-600 p-2 text-white">
          <GraduationCap className="h-5 w-5" />
        </span>
        <div>
          <div className="text-sm font-semibold leading-tight text-ink-900">Study Hub</div>
          <div className="text-[11px] text-ink-500">Semester 6 · CST</div>
        </div>
      </div>

      <button
        onClick={onOpenSearch}
        className="mx-4 mb-3 flex items-center justify-between rounded-xl border border-ink-200 px-3 py-2 text-left text-xs text-ink-500 hover:bg-ink-50"
      >
        <span>Search topic, note...</span>
        <kbd className="rounded border border-ink-200 bg-ink-50 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
      </button>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-4">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) => `nav-link ${isActive ? 'nav-link-active' : ''}`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="flex-1">{item.label}</span>
            {item.phase > 1 && (
              <span className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                P{item.phase}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-ink-100 p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="muted">Semester progress</span>
          <span className="text-sm font-semibold text-ink-900">{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink-100">
          <div className="h-2 rounded-full bg-brand-600" style={{ width: `${percent}%` }} />
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-ink-500">
          <Sparkles className="h-3 w-3 text-brand-500" />
          {dashboard?.stats?.currentStreak ?? 0} দিনের streak
        </p>
      </div>
    </aside>
  );
}
