/**
 * PWA support — everything that makes the website behave like an installed app.
 *
 * What lives here:
 *   - service-worker registration + "a new version is ready" events;
 *   - whether the app is already running as an installed app (Android/desktop)
 *     or on the iOS home screen;
 *   - the platform-specific "how to install" text, because the install button
 *     only exists on Android/desktop Chrome/Edge — iPhone/iPad have no prompt
 *     at all and must be told the Share → Add to Home Screen steps;
 *   - whether this is the packaged desktop build (Electron), which sets
 *     `window.studyHubDesktop` from its preload script.
 *
 * Nothing here touches study data — it only deals with the app shell.
 */

/** The packaged desktop app (Electron) marks itself here — see desktop/preload.cjs */
export function isDesktopApp() {
  return globalThis.studyHubDesktop?.isDesktop === true;
}

/** True when the page already runs as an installed app (standalone window). */
export function isInstalledApp() {
  if (typeof window === 'undefined') return false;
  if (isDesktopApp()) return true;
  const standalone =
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.matchMedia?.('(display-mode: window-controls-overlay)')?.matches ||
    // iOS Safari keeps its own flag
    window.navigator.standalone === true;
  return Boolean(standalone);
}

/** Rough device guess — used only to show the right install instructions. */
export function platformKind() {
  if (isDesktopApp()) return 'desktop-app';
  if (typeof navigator === 'undefined') return 'other';
  const ua = navigator.userAgent;
  const iPad = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1; // iPadOS pretends to be a Mac
  if (/iPhone|iPad|iPod/.test(ua) || iPad) return 'ios';
  if (/Android/.test(ua)) return 'android';
  if (/Windows|Macintosh|Linux|CrOS/.test(ua)) return 'desktop';
  return 'other';
}

/** Steps to install, in the student's own words, per device. */
export function installSteps(kind = platformKind()) {
  switch (kind) {
    case 'ios':
      return {
        title: 'iPhone / iPad-এ অ্যাপ বানাও',
        steps: [
          'Safari-তে এই পেজটা খোলো (Chrome-এ iOS-এ Add to Home Screen কাজ করে না)',
          'নিচের মাঝখানে Share (⬆️) বাটনে চাপো',
          'তালিকা থেকে “Add to Home Screen” বেছে নাও',
          'নাম “Study Hub” রেখে Add চাপো — হোম স্ক্রিনে অ্যাপের আইকন বসে যাবে',
        ],
      };
    case 'android':
      return {
        title: 'Android-এ অ্যাপ বানাও',
        steps: [
          'Chrome-এ উপরে ডান দিকের ⋮ মেনুতে চাপো',
          '“Install app” / “Add to Home screen” বেছে নাও',
          'Install চাপো — অ্যাপ হিসেবে আইকন বসে যাবে, ইন্টারনেট ছাড়াও চলবে',
        ],
      };
    case 'desktop':
      return {
        title: 'কম্পিউটারে অ্যাপ বানাও',
        steps: [
          'Chrome বা Edge-এ অ্যাড্রেস বারের ডান দিকে ইনস্টল (⊕ / 🖥️) আইকনে চাপো',
          'অথবা ⋮ মেনু → “Install Study Hub…” / “Apps → Install this site as an app”',
          'Install চাপলে আলাদা উইন্ডোতে অ্যাপের মতো খুলবে (ব্রাউজারের ট্যাব নয়)',
          'নিজের নাম-লোগো দিয়ে সত্যিকারের ডেস্কটপ অ্যাপ চাইলে ডেস্কটপ বিল্ড ব্যবহার করো (docs/desktop-app-bn.md)',
        ],
      };
    case 'desktop-app':
      return {
        title: 'ডেস্কটপ অ্যাপে চলছো',
        steps: [
          'এটা ইনস্টল করা ডেস্কটপ অ্যাপ — ব্রাউজার লাগে না',
          'ডেটা এই কম্পিউটারেই থাকে; মাঝে মাঝে Settings → Backup (JSON) নামিয়ে রাখো',
        ],
      };
    default:
      return {
        title: 'অ্যাপ হিসেবে ইনস্টল করো',
        steps: ['ব্রাউজার মেনু থেকে “Install app” / “Add to Home screen” খুঁজে নাও'],
      };
  }
}

/**
 * Registers the service worker (production builds only — the dev server has its
 * own caching and a stale worker there is a known headache).
 */
export function registerServiceWorker({ onUpdateReady, onOfflineReady } = {}) {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return () => {};
  if (!import.meta.env?.PROD) return () => {};
  // the packaged desktop app already loads every file from disk — a worker would
  // only add a second cache to keep in sync
  if (isDesktopApp()) return () => {};

  const swUrl = new URL('sw.js', document.baseURI).href;
  let cancelled = false;

  navigator.serviceWorker
    .register(swUrl, { scope: './' })
    .then((reg) => {
      if (cancelled) return;
      registration = reg;

      if (reg.waiting && navigator.serviceWorker.controller) onUpdateReady?.(reg);
      reg.addEventListener('updatefound', () => {
        const installing = reg.installing;
        installing?.addEventListener('statechange', () => {
          if (installing.state === 'installed' && navigator.serviceWorker.controller) {
            onUpdateReady?.(reg);
          } else if (installing.state === 'installed') {
            onOfflineReady?.();
          }
        });
      });
    })
    .catch((error) => {
      // never break the app because of the worker
      console.warn('[study-hub] service worker skipped:', error.message);
    });

  // Cleanup only stops THIS caller from reacting to changes — the registration
  // itself must stay, otherwise unmounting a component would kill offline mode.
  return () => {
    cancelled = true;
  };
}

/** Applies a waiting service worker and reloads once it is in charge. */
export function applyServiceWorkerUpdate(registration) {
  const waiting = registration?.waiting;
  if (!waiting) {
    window.location.reload();
    return;
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => window.location.reload(), { once: true });
  waiting.postMessage('SKIP_WAITING');
}
