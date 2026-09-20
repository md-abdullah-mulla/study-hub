import { useEffect, useState } from 'react';
import { CheckCircle2, Download, Smartphone, Monitor } from 'lucide-react';
import { Card, CardHeader } from '../ui/index.jsx';
import { installSteps, isDesktopApp, isInstalledApp, platformKind } from '../../lib/pwa.js';

/** Injected by Vite from client/package.json (see vite.config.js → define). */
const APP_VERSION = typeof __APP_VERSION__ === 'string' ? __APP_VERSION__ : '1.0.0';

/**
 * "Install as an app" card (Settings → App).
 *
 * The honest behaviour of the install prompt: Chrome/Edge (Android + desktop)
 * fire `beforeinstallprompt`, so a real Install button can be shown. iPhone and
 * iPad have no such event — there the card only shows the steps, because
 * pretending there is a button would be a lie.
 */
export function InstallAppCard() {
  const [promptEvent, setPromptEvent] = useState(null);
  const [installed, setInstalled] = useState(isInstalledApp());
  const [message, setMessage] = useState('');

  useEffect(() => {
    const onPrompt = (event) => {
      event.preventDefault(); // keep the event so the button can trigger it later
      setPromptEvent(event);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
      setMessage('অ্যাপ ইনস্টল হয়ে গেছে — হোম স্ক্রিন / Start menu থেকে খুলে নাও।');
    };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const kind = platformKind();
  const info = installSteps(kind);

  async function install() {
    if (!promptEvent) return;
    promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setMessage(
      choice?.outcome === 'accepted'
        ? 'ইনস্টল করা হচ্ছে… শেষ হলে হোম স্ক্রিনে Study Hub আইকন দেখবে।'
        : 'ইনস্টল বাতিল করা হয়েছে — যখন চাও আবার করতে পারবে।'
    );
    if (choice?.outcome === 'accepted') setPromptEvent(null);
  }

  return (
    <Card>
      <CardHeader
        title="App হিসেবে ইনস্টল করো"
        subtitle="হোম স্ক্রিন / Start menu-তে আইকন — ইন্টারনেট ছাড়াও চলবে"
        icon={kind === 'desktop' || kind === 'desktop-app' ? Monitor : Smartphone}
      />

      <div className="p-4 sm:p-5">
        {installed || kind === 'desktop-app' ? (
          <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 p-3">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <div className="text-sm text-emerald-900">
              <p className="font-medium">{isDesktopApp() ? 'ডেস্কটপ অ্যাপে চলছো' : 'অ্যাপ হিসেবে ইনস্টল করা আছে'}</p>
              <p className="mt-0.5 text-emerald-800/80">
                {isDesktopApp()
                  ? 'ব্রাউজার লাগবে না, ইন্টারনেটও লাগবে না — ডেটা এই কম্পিউটারে IndexedDB-তে থাকে।'
                  : 'ফোনের হোম স্ক্রিন / কম্পিউটারের Start menu থেকে Study Hub খুলে নাও — ব্রাউজারের ট্যাব লাগবে না।'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <button onClick={install} className={`btn-primary ${promptEvent ? '' : 'hidden'}`}>
                <Download className="h-4 w-4" />
                Install app
              </button>
              <span className="muted">
                {promptEvent
                  ? 'এক চাপেই ইনস্টল হবে — ব্রাউজার নিজেই নিশ্চিত করবে।'
                  : 'এই ব্রাউজারে একটা চাপে ইনস্টলের সুবিধা নেই, তাই নিচের ধাপগুলো ফলো করো।'}
              </span>
            </div>

            <div className="mt-4 rounded-xl border border-ink-200 bg-ink-50/60 p-3">
              <p className="text-sm font-medium text-ink-800">{info.title}</p>
              <ol className="mt-2 space-y-1.5 text-sm text-ink-600">
                {info.steps.map((step, index) => (
                  <li key={step} className="flex gap-2">
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[11px] font-semibold text-brand-600 ring-1 ring-ink-200">
                      {index + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}

        {message && <p className="mt-3 text-sm text-brand-700">{message}</p>}

        {isDesktopApp() && (
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => window.studyHubDesktop?.openDataFolder()} className="btn-ghost">
              ডেটা ফোল্ডার খুলো
            </button>
            <button onClick={() => window.studyHubDesktop?.openDownloadsFolder()} className="btn-ghost">
              Download ফোল্ডার খুলো
            </button>
          </div>
        )}

        <p className="muted mt-3">
          এখন চলছে: <span className="font-medium">{isDesktopApp() ? 'ডেস্কটপ অ্যাপ' : isInstalledApp() ? 'ইনস্টল করা অ্যাপ' : 'ব্রাউজার'}</span> · Version{' '}
          {APP_VERSION} · অ্যাপ আর ওয়েবসাইট — দুটোতেই একই জিনিস, তবে ডেটা আলাদা জায়গায় থাকে (প্রতিটি নিজের
          স্টোরেজে), তাই Settings → <span className="font-medium">Backup (JSON)</span> দিয়ে এক জায়গা থেকে আরেক জায়গায় নেওয়া যায়।
        </p>
      </div>
    </Card>
  );
}
