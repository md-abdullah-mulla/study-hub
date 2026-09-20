import { useState } from 'react';
import { Link } from 'react-router-dom';
import { RefreshCw, CheckCircle2, CalendarClock, Info } from 'lucide-react';
import { api } from '../api/client.js';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { Card, CardHeader, Button, EmptyState } from '../components/ui/index.jsx';
import { REVISION_STAGE_LABEL } from '../lib/status.js';
import { formatDateShort } from '../lib/format.js';

/**
 * REVISION (spec §14)
 * The queue itself is live in Phase 1 (it only needs topic data):
 *   Learned → Revision 1 → Revision 2 → Final Revision
 * Clicking "Revision complete" moves the topic to the next stage and sets the
 * next date. Revision reminders/notifications come with Phase 2.
 */
export default function RevisionPage() {
  const { dashboard, refresh } = useAppData();
  const [busyId, setBusyId] = useState(null);
  const toast = useToast();
  const queue = dashboard?.revisionDue ?? [];

  const complete = async (topicId) => {
    setBusyId(topicId);
    try {
      const updated = await api.topics.completeRevision(topicId);
      toast.success(`পরের ধাপ: ${REVISION_STAGE_LABEL[updated.revisionStage]}`);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Revision Due"
          subtitle={`${queue.length}টি topic এখন revision-এর জন্য অপেক্ষা করছে`}
          icon={RefreshCw}
        />

        {queue.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="এখন revision বাকি নেই"
            description="কোনো topic “শেষ করেছি” করলে ৩ দিন পরে সেটা এখানে আসবে (Learned → Revision 1 → Revision 2 → Final)।"
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {queue.map((item) => (
              <li key={item.topicId} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:px-5">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.subjectColor }} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-ink-900">{item.topicName}</div>
                  <div className="muted truncate">
                    {item.subjectName} · Chapter {item.chapterNumber}: {item.chapterName}
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="chip bg-ink-100 text-ink-600">{REVISION_STAGE_LABEL[item.stage]}</span>
                    <span className={`chip ${item.overdueDays > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
                      {item.overdueDays > 0
                        ? `${item.overdueDays} দিন দেরি`
                        : item.dueAt
                        ? `Due: ${formatDateShort(item.dueAt)}`
                        : 'আজ'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/subjects/${item.subjectId}/chapters/${item.chapterId}`}
                    className="btn-ghost"
                  >
                    পড়তে যাই
                  </Link>
                  <Button onClick={() => complete(item.topicId)} disabled={busyId === item.topicId}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {busyId === item.topicId ? '...' : 'Revision complete'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <div className="flex items-start gap-2 p-4 sm:p-5">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
          <div className="text-xs text-ink-600">
            <p className="font-medium text-ink-700">Revision কীভাবে হিসাব হয়</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              <li>Topic complete করলে ধরা হয় তুমি “Learned” — ৩ দিন পরে প্রথম revision date বসে।</li>
              <li>Revision 1 → ৭ দিন পরে, Revision 2 → ১৪ দিন পরে, Final Revision-এর পরে আর date বসে না।</li>
              <li>
                <CalendarClock className="mr-1 inline h-3 w-3" />
                “রিভিশন দরকার” বেছে দিলে progress কমে না — topic complete-ই থাকে, শুধু দুর্বল হিসেবে চিহ্নিত হয়।
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
