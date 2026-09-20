/** Topic status → label / colour. Kept in one place so all screens agree. */
export const TOPIC_STATUS = {
  not_started: { label: 'শুরু করিনি', short: 'শুরু হয়নি', badge: 'bg-ink-100 text-ink-600', dot: '#94a3b8' },
  studying: { label: 'চলছে', short: 'চলছে', badge: 'bg-amber-100 text-amber-700', dot: '#f59e0b' },
  completed: { label: 'শেষ করেছি', short: 'শেষ', badge: 'bg-emerald-100 text-emerald-700', dot: '#10b981' },
  needs_revision: { label: 'রিভিশন দরকার', short: 'রিভিশন', badge: 'bg-rose-100 text-rose-700', dot: '#f43f5e' },
};

export const STATUS_ORDER = ['not_started', 'studying', 'completed', 'needs_revision'];

export const REVISION_STAGE_LABEL = {
  none: '—',
  learned: 'Learned',
  revision_1: 'Revision 1',
  revision_2: 'Revision 2',
  final: 'Final Revision',
};

export const IMPORTANCE_LABEL = {
  low: 'কম গুরুত্ব',
  medium: 'মাঝারি',
  high: 'বেশি গুরুত্ব',
};
