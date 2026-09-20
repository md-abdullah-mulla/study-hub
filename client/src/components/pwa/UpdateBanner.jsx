import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { applyServiceWorkerUpdate, registerServiceWorker } from '../../lib/pwa.js';

/**
 * Keeps the installed app up to date.
 *
 * A service worker serves the cached shell, which is exactly what makes the app
 * work offline — but it also means a new deploy would otherwise stay invisible.
 * This banner watches for a newly installed worker and offers one tap to switch,
 * instead of silently reloading and losing what the student was typing.
 */
export function UpdateBanner() {
  const [registration, setRegistration] = useState(null);
  const [offlineReady, setOfflineReady] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const stop = registerServiceWorker({
      onUpdateReady: (reg) => setRegistration(reg),
      onOfflineReady: () => setOfflineReady(true),
    });
    return () => stop();
  }, []);

  if (hidden) return null;

  if (registration) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 lg:px-0">
        <div className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white p-3 shadow-card">
          <RefreshCw className="h-4 w-4 shrink-0 text-brand-600" />
          <p className="flex-1 text-sm text-ink-700">নতুন version পাওয়া গেছে।</p>
          <button onClick={() => applyServiceWorkerUpdate(registration)} className="btn-primary px-2.5 py-1 text-xs">
            Reload
          </button>
          <button onClick={() => setHidden(true)} aria-label="বন্ধ করো" className="rounded-lg p-1 text-ink-400 hover:bg-ink-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  if (offlineReady) {
    return (
      <div className="fixed inset-x-0 bottom-16 z-40 px-3 lg:bottom-4 lg:left-auto lg:right-4 lg:w-96 lg:px-0">
        <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-card">
          <p className="flex-1 text-sm text-emerald-900">অ্যাপ এখন ইন্টারনেট ছাড়াও চলবে ✅</p>
          <button onClick={() => setOfflineReady(false)} aria-label="বন্ধ করো" className="rounded-lg p-1 text-emerald-700 hover:bg-emerald-100">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
