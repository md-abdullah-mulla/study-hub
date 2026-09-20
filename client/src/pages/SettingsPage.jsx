import { Download, Database, Info, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { Card, CardHeader, StatCard } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { api } from '../api/client.js';
import { PHASE_INFO } from '../components/layout/navItems.js';

/** Settings + Backup/Export (spec §31) + the development roadmap. */
export default function SettingsPage() {
  const { meta, subjects, semester } = useAppData();
  const totalChapters = subjects.reduce((n, s) => n + s.chapters.length, 0);

  return (
    <div className="space-y-4 sm:space-y-5">
      <Card>
        <CardHeader title="Data Backup & Export" subtitle="নিজের ডেটা সবসময় হাতের কাছে রাখো" icon={Download} />
        <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
          <a href={api.backupUrl} className="rounded-xl border border-ink-200 p-3.5 hover:bg-ink-50">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
              <Database className="h-4 w-4 text-brand-600" /> Backup (JSON)
            </div>
            <p className="muted mt-1">
              সব subject, chapter, topic, note, plan — পুরো backup এক ফাইলে। পরে আবার import করার জন্য রেখে দাও।
            </p>
          </a>
          <a href={api.csvUrl} className="rounded-xl border border-ink-200 p-3.5 hover:bg-ink-50">
            <div className="flex items-center gap-2 text-sm font-medium text-ink-900">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Topic list (CSV)
            </div>
            <p className="muted mt-1">Excel/Google Sheets-এ খুলে প্রিন্ট বা নিজের মতো সাজিয়ে নিতে পারবে।</p>
          </a>
        </div>
        <div className="border-t border-ink-100 px-4 py-3 sm:px-5">
          <p className="muted">
            PDF export আর auto-backup Phase 5-এ যোগ হবে। এখন JSON/CSV দিয়ে নিজে backup রাখো।
          </p>
        </div>
      </Card>

      <Card>
        <CardHeader title="Data Summary" icon={Info} />
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4 sm:p-5">
          <StatCard label="Subject" value={subjects.length} />
          <StatCard label="Chapter" value={totalChapters} />
          <StatCard label="Topic" value={semester?.progress?.total ?? 0} />
          <StatCard label="Complete" value={`${semester?.progress?.percent ?? 0}%`} tone="success" />
        </div>
        <div className="flex flex-wrap items-center gap-2 border-t border-ink-100 px-4 py-3 text-xs text-ink-600 sm:px-5">
          <RotateCcw className="h-3.5 w-3.5" />
          পুরো database নতুন করে শুরু করতে:
          <code className="rounded bg-ink-100 px-1.5 py-0.5">cd server &amp;&amp; npm run reset</code>
          <span className="text-rose-600">(সব progress মুছে যাবে — আগে backup নিন)</span>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Development Roadmap"
          subtitle="ছোট ছোট ধাপে বানানো হচ্ছে — Phase 1 এখন চলছে"
          icon={Info}
        />
        <ol className="space-y-3 p-4 sm:p-5">
          <li className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="text-sm font-semibold text-emerald-800">Phase 1 — MVP (সম্পূর্ণ ✅)</div>
            <p className="muted mt-1">
              Dashboard, Subject / Chapter / Topic management, auto progress, recommendation (কারণসহ),
              today's plan, revision queue, subject-প্রতি note, import chapter, global search, backup/export।
            </p>
          </li>
          {[2, 3, 4, 5].map((phase) => (
            <li key={phase} className="rounded-xl border border-ink-200 p-3">
              <div className="text-sm font-semibold text-ink-800">{PHASE_INFO[phase].title}</div>
              <ul className="muted mt-1 list-inside list-disc space-y-0.5">
                {PHASE_INFO[phase].points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </Card>

      <Card>
        <CardHeader title="About" icon={Info} />
        <div className="space-y-1 p-4 text-xs text-ink-600 sm:p-5">
          <p>
            <span className="font-medium text-ink-800">{meta?.appName ?? 'Smart Semester Study Manager'}</span> · v0.1
            (Phase 1)
          </p>
          <p>
            {meta?.program ?? 'Diploma in Computer Science & Technology'} · Semester {meta?.semester ?? 6}
          </p>
          <p>
            পুরো app local-এ চলে: React + Tailwind (frontend), Node + Express (API), SQLite file database। কোনো
            password বা internet ছাড়াই তোমার নিজের মেশিনে।
          </p>
          <p className="pt-1">
            মূল workflow: <span className="font-medium text-ink-800">Study → Track → Analyse → Revise → Improve</span>
          </p>
        </div>
      </Card>
    </div>
  );
}
