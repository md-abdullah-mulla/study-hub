import { X } from 'lucide-react';
import { useEffect } from 'react';

/** Small shared UI pieces. Nothing here knows about study logic. */

export function Card({ className = '', children, ...rest }) {
  return (
    <div className={`card ${className}`} {...rest}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon: Icon }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-ink-100 px-4 py-3 sm:px-5">
      <div className="flex items-start gap-2.5">
        {Icon && (
          <span className="mt-0.5 rounded-lg bg-brand-50 p-1.5 text-brand-600">
            <Icon className="h-4 w-4" />
          </span>
        )}
        <div>
          <h2 className="section-title">{title}</h2>
          {subtitle && <p className="muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function Button({ variant = 'primary', className = '', children, ...rest }) {
  const variants = { primary: 'btn-primary', ghost: 'btn-ghost', danger: 'btn-danger' };
  return (
    <button className={`${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function Badge({ children, className = '' }) {
  return <span className={`chip ${className}`}>{children}</span>;
}

export function StatCard({ label, value, hint, icon: Icon, tone = 'default' }) {
  const tones = {
    default: 'bg-white',
    brand: 'bg-brand-50 border-brand-100',
    success: 'bg-emerald-50 border-emerald-100',
    warn: 'bg-amber-50 border-amber-100',
  };
  return (
    <div className={`rounded-2xl border border-ink-200 p-3.5 shadow-card sm:p-4 ${tones[tone]}`}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium uppercase tracking-wide text-ink-500">{label}</span>
        {Icon && <Icon className="h-4 w-4 text-ink-400" />}
      </div>
      <div className="mt-1.5 text-xl font-semibold text-ink-900 sm:text-2xl">{value}</div>
      {hint && <div className="muted mt-0.5">{hint}</div>}
    </div>
  );
}

export function EmptyState({ title, description, action, icon: Icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-10 text-center">
      {Icon && (
        <span className="rounded-2xl bg-ink-100 p-3 text-ink-500">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
      {description && <p className="muted max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export function Modal({ open, title, onClose, children, footer, size = 'md' }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/40 p-0 sm:items-center sm:p-4">
      <div
        className={`w-full ${widths[size]} max-h-[92vh] overflow-y-auto rounded-t-2xl bg-white shadow-xl sm:rounded-2xl`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3 sm:px-5">
          <h3 className="text-sm font-semibold text-ink-900">{title}</h3>
          <button onClick={onClose} aria-label="বন্ধ করুন" className="rounded-lg p-1 text-ink-500 hover:bg-ink-100">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="px-4 py-4 sm:px-5">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-ink-100 px-4 py-3 sm:px-5">{footer}</div>}
      </div>
    </div>
  );
}

export function Spinner({ label = 'লোড হচ্ছে...' }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-ink-500">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />
      <span className="text-sm">{label}</span>
    </div>
  );
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Delete', onConfirm, onClose, busy }) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button variant="danger" onClick={onConfirm} disabled={busy}>
            {busy ? 'অপেক্ষা করুন...' : confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-ink-600">{message}</p>
    </Modal>
  );
}
