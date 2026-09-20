import { Link } from 'react-router-dom';
import { Rocket, CircleDashed } from 'lucide-react';
import { Card, CardHeader } from '../components/ui/index.jsx';

/**
 * Honest placeholder for screens that arrive in later phases (spec §33).
 * It lists exactly what will be built — no fake buttons, no fake data.
 */
export default function ComingSoonPage({ phase, title, description, points = [] }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader title={title} subtitle={description} icon={Rocket} />
        <div className="p-4 sm:p-5">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-xs font-medium text-ink-600">
            <CircleDashed className="h-3.5 w-3.5" /> Phase {phase} — এখনো তৈরি হয়নি
          </div>
          <ul className="space-y-2">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-2 text-sm text-ink-700">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                {point}
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-ink-700">
            এখন Phase 1 ব্যবহার করে দেখো — progress tracking, dashboard, revision queue সবই কাজ করছে।
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link to="/" className="btn-primary">
              Dashboard
            </Link>
            <Link to="/subjects" className="btn-ghost">
              Subject দেখুন
            </Link>
            <Link to="/settings" className="btn-ghost">
              Roadmap দেখুন
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
