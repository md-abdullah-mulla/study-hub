/** Presentation helpers — formatting only, no business logic. */

export function minutesLabel(minutes = 0) {
  if (!minutes) return '০ মিনিট';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest} মিনিট`;
  if (!rest) return `${hours} ঘণ্টা`;
  return `${hours} ঘ ${rest} মি`;
}

const BN_MONTHS = [
  'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
  'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
];

export function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()} ${BN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateShort(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}/${String(d.getFullYear()).slice(2)}`;
}

/** "৩ দিন আগে" style relative label, kept simple and honest. */
export function relativeDays(days) {
  if (days === null || days === undefined) return 'কখনো না';
  if (days === 0) return 'আজ';
  if (days === 1) return 'গতকাল';
  return `${days} দিন আগে`;
}

export function daysSince(iso) {
  if (!iso) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000));
}

export function todayTitle() {
  const d = new Date();
  const weekdays = ['রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'];
  return `${weekdays[d.getDay()]}, ${d.getDate()} ${BN_MONTHS[d.getMonth()]}`;
}

export function percentLabel(value = 0) {
  return `${Math.round(value)}%`;
}
