import { Check, BookOpen, RotateCcw, Circle } from 'lucide-react';
import { TOPIC_STATUS, STATUS_ORDER } from '../../lib/status.js';

const ICONS = {
  not_started: Circle,
  studying: BookOpen,
  completed: Check,
  needs_revision: RotateCcw,
};

/**
 * Four status buttons per topic (spec §8).
 * Progress is derived from this choice on the server — never typed by hand (§28).
 * Labels are hidden on narrow screens (icons + tooltip remain), so only ONE
 * picker is needed per row instead of separate desktop/mobile copies.
 */
export function TopicStatusPicker({ value, onChange, disabled, compact = false }) {
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Topic status">
      {STATUS_ORDER.map((status) => {
        const Icon = ICONS[status];
        const active = value === status;
        return (
          <button
            key={status}
            type="button"
            disabled={disabled}
            title={TOPIC_STATUS[status].label}
            aria-label={TOPIC_STATUS[status].label}
            aria-pressed={active}
            onClick={() => onChange(status)}
            className={`inline-flex items-center justify-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors disabled:opacity-50 sm:px-2.5 ${
              active ? 'border-transparent text-white' : 'border-ink-200 bg-white text-ink-500 hover:bg-ink-50'
            }`}
            style={active ? { backgroundColor: TOPIC_STATUS[status].dot } : undefined}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {!compact && <span className="hidden sm:inline">{TOPIC_STATUS[status].label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function TopicStatusBadge({ status }) {
  const meta = TOPIC_STATUS[status] ?? TOPIC_STATUS.not_started;
  return <span className={`chip ${meta.badge}`}>{meta.label}</span>;
}
