import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar.jsx';
import { BottomNav } from './BottomNav.jsx';
import { TopBar } from './TopBar.jsx';
import { SearchDialog } from '../search/SearchDialog.jsx';
import { UpdateBanner } from '../pwa/UpdateBanner.jsx';
import { NAV_ITEMS } from './navItems.js';
import { Modal, Spinner } from '../ui/index.jsx';
import { useAppData } from '../../state/AppDataContext.jsx';

/** Shell for every page: sidebar (desktop) + top bar + bottom nav (mobile). */
export function AppLayout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { loading, error, reload } = useAppData();

  // keyboard shortcuts: ⌘K / Ctrl+K or "/" opens search
  useEffect(() => {
    const onKey = (event) => {
      const typing = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
      if ((event.key === 'k' && (event.metaKey || event.ctrlKey)) || (event.key === '/' && !typing)) {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    window.scrollTo({ top: 0 });
  }, [location.pathname]);

  const activeItem = [...NAV_ITEMS].reverse().find((item) =>
    item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to)
  );

  const openItem = useCallback(
    (to) => {
      setMenuOpen(false);
      navigate(to);
    },
    [navigate]
  );

  return (
    <div className="flex min-h-screen bg-ink-50">
      <Sidebar onOpenSearch={() => setSearchOpen(true)} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar
          title={activeItem?.label ?? 'Study Hub'}
          onOpenSearch={() => setSearchOpen(true)}
          onOpenMenu={() => setMenuOpen(true)}
        />

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-4 sm:px-6 sm:pt-6 lg:pb-10">
          {error ? (
            <div className="card card-pad text-center">
              <p className="text-sm font-medium text-red-600">
                সার্ভারের সাথে যোগাযোগ করা যাচ্ছে না।
              </p>
              <p className="muted mt-1">
                Backend চালু আছে কিনা দেখুন (<code>cd server &amp;&amp; npm start</code>), তারপর আবার চেষ্টা করুন।
              </p>
              <button onClick={() => reload()} className="btn-primary mt-3">
                আবার চেষ্টা করুন
              </button>
            </div>
          ) : loading ? (
            <Spinner />
          ) : (
            <Outlet />
          )}
        </main>

        <BottomNav />
      </div>

      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />

      {/* app version: offers a one-tap reload when a new build is deployed */}
      <UpdateBanner />

      <Modal open={menuOpen} title="মেনু" onClose={() => setMenuOpen(false)} size="sm">
        <div className="grid grid-cols-2 gap-2">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.to}
              onClick={() => openItem(item.to)}
              className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2.5 text-left text-sm text-ink-700 hover:bg-ink-50"
            >
              <item.icon className="h-4 w-4 text-ink-500" />
              <span className="flex-1">{item.label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}
