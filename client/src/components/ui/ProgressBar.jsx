import { percentLabel } from '../../lib/format.js';

/** Thin, readable progress bar. Colour follows the subject when given. */
export function ProgressBar({ value = 0, color = '#2554e0', size = 'md', showLabel = false, label }) {
  const height = size === 'sm' ? 'h-1.5' : size === 'lg' ? 'h-3' : 'h-2';
  const width = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full">
      {(showLabel || label) && (
        <div className="mb-1 flex items-center justify-between text-xs text-ink-500">
          <span>{label}</span>
          {showLabel && <span className="font-semibold text-ink-700">{percentLabel(value)}</span>}
        </div>
      )}
      <div className={`w-full overflow-hidden rounded-full bg-ink-100 ${height}`}>
        <div
          className={`${height} rounded-full transition-[width] duration-500`}
          style={{ width: `${width}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

/** SVG donut used for the overall semester progress (no chart library needed). */
export function Donut({ value = 0, size = 132, stroke = 12, color = '#2554e0', children }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 600ms ease' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
