import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Library, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '../api/client.js';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { Card, CardHeader, Button, EmptyState } from '../components/ui/index.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { SubjectFormModal } from '../components/forms/Forms.jsx';
import { relativeDays, daysSince } from '../lib/format.js';

/** Subject overview: every subject with real progress, click to open (spec §9). */
export default function SubjectsPage() {
  const { subjects, refresh } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const createSubject = async (form) => {
    setBusy(true);
    try {
      await api.subjects.create({
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        code: form.code.trim() || null,
        color: form.color,
      });
      setAddOpen(false);
      await refresh();
      toast.success('নতুন subject যোগ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="আমার Subject"
          subtitle={`Semester 6 — মোট ${subjects.length}টি subject`}
          icon={Library}
          action={
            <Button onClick={() => setAddOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Subject
            </Button>
          }
        />

        {subjects.length === 0 ? (
          <EmptyState
            icon={Library}
            title="কোনো subject নেই"
            description="Subject যোগ করুন অথবা Import Chapter দিয়ে পুরো chapter একবারে বসান।"
            action={
              <Link to="/import" className="btn-ghost mt-2">
                Import Chapter
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-5">
            {subjects.map((subject) => (
              <Link
                key={subject.id}
                to={`/subjects/${subject.id}`}
                className="group rounded-2xl border border-ink-200 bg-white p-4 transition-colors hover:border-brand-300 hover:bg-brand-50/40"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 items-start gap-2.5">
                    <span
                      className="mt-1 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: subject.color }}
                    />
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-ink-900">{subject.name}</h3>
                      {subject.nameBn && <p className="muted truncate">{subject.nameBn}</p>}
                      {subject.code && <p className="muted">Code: {subject.code}</p>}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400 group-hover:text-brand-500" />
                </div>

                <div className="mt-3">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-ink-500">
                      {subject.progress.completed}/{subject.progress.total} topic
                    </span>
                    <span className="font-semibold text-ink-900">{subject.progress.percent}%</span>
                  </div>
                  <ProgressBar value={subject.progress.percent} color={subject.color} size="sm" />
                </div>

                <div className="muted mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span>
                    {subject.completedChapters}/{subject.chapterCount} chapter শেষ
                  </span>
                  <span>
                    শেষ পড়া: {subject.lastStudiedAt ? relativeDays(daysSince(subject.lastStudiedAt)) : 'কখনো না'}
                  </span>
                  {subject.revisionDueCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-rose-600">
                      <AlertCircle className="h-3 w-3" /> {subject.revisionDueCount} revision due
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>

      <SubjectFormModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={createSubject}
        busy={busy}
      />
    </div>
  );
}
