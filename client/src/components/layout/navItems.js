import {
  LayoutDashboard,
  Library,
  ListTree,
  BookOpenCheck,
  FileInput,
  NotebookPen,
  BarChart3,
  Settings,
  Sparkles,
  RefreshCw,
  ListChecks,
} from 'lucide-react';

/**
 * Navigation model (spec §25).
 * `phase` tells the UI whether the screen is live or planned, so no nav item
 * is ever a dead end: planned ones open an honest "Phase X" page.
 */
export const NAV_ITEMS = [
  { to: '/', label: 'ড্যাশবোর্ড', en: 'Dashboard', icon: LayoutDashboard, phase: 1, mobile: true },
  { to: '/subjects', label: 'Subject', en: 'Subjects', icon: Library, phase: 1, mobile: true },
  { to: '/chapters', label: 'Chapter & Topic', en: 'Chapters', icon: ListTree, phase: 1, mobile: true },
  { to: '/study', label: 'Study Session', en: 'Study', icon: BookOpenCheck, phase: 1, mobile: true },
  { to: '/revision', label: 'Revision', en: 'Revision', icon: RefreshCw, phase: 2, mobile: false },
  { to: '/quiz', label: 'Quiz', en: 'Quiz', icon: ListChecks, phase: 1, mobile: true },
  { to: '/ai', label: 'AI Assistant', en: 'AI', icon: Sparkles, phase: 4, mobile: false },
  { to: '/analytics', label: 'Analytics', en: 'Analytics', icon: BarChart3, phase: 1, mobile: true },
  { to: '/notes', label: 'Notes', en: 'Notes', icon: NotebookPen, phase: 1, mobile: true },
  { to: '/import', label: 'Import Chapter', en: 'Import', icon: FileInput, phase: 1, mobile: false },
  { to: '/settings', label: 'Settings', en: 'Settings', icon: Settings, phase: 1, mobile: false },
];

export const MOBILE_NAV = [
  { to: '/', label: 'হোম', icon: LayoutDashboard },
  { to: '/subjects', label: 'Subject', icon: Library },
  { to: '/chapters', label: 'Chapter', icon: ListTree },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/more', label: 'আরও', icon: Settings },
];

/** Small copy table for the planned screens — keeps pages consistent. */
export const PHASE_INFO = {
  2: {
    title: 'Phase 2 — Study Session & Analytics',
    points: [
      'Start/stop study timer (subject → chapter → topic)',
      'Study history: daily / weekly / monthly study time',
      'Revision schedule: Learned → Revision 1 → Revision 2 → Final',
      'Real study-time charts (এখন শুধু progress-ভিত্তিক chart আছে)',
    ],
  },
  3: {
    title: 'Phase 3 — Quiz & Exam Mode',
    points: [
      'Chapter-wise quiz: MCQ, True/False, Short, Viva',
      'Score, accuracy, weak topic detection',
      'Exam date দিলে remaining days + daily target plan',
      'Weak topic থেকে automatic revision suggestion',
    ],
  },
  4: {
    title: 'Phase 4 — AI Study Assistant',
    points: [
      'সহজ বাংলায় explanation, short note, exam note',
      'MCQ / short question / viva question generation',
      'Generated content database-এ save / edit / delete',
      'AI quiz generation',
    ],
  },
  5: {
    title: 'Phase 5 — AI Illustration & Export',
    points: [
      'Topic-wise educational diagram generation (MQTT flow, IoT layers...)',
      'Illustration preview + download',
      'PDF / advanced export ও advanced analytics',
    ],
  },
};
