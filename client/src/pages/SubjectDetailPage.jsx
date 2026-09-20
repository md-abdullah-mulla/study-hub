import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ChevronRight, BookOpen } from 'lucide-react';
import { api } from '../api/client.js';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { Card, CardHeader, Button, EmptyState, ConfirmDialog } from '../components/ui/index.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { SubjectFormModal, ChapterFormModal } from '../components/forms/Forms.jsx';

/** One subject → its chapters with progress (spec §2–§7). */
export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const navigate = useNavigate();
  const { findSubject, refresh } = useAppData();
  const subject = findSubject(subjectId);
  const [editOpen, setEditOpen] = useState(false);
  const [addChapterOpen, setAddChapterOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  if (!subject) {
    return (
      <EmptyState
        title="Subject পাওয়া যায়নি"
        description="হয়তো delete করা হয়েছে।"
        action={
          <Link to="/subjects" className="btn-ghost mt-2">
            Subject list-এ ফিরে যান
          </Link>
        }
      />
    );
  }

  const saveSubject = async (form) => {
    setBusy(true);
    try {
      await api.subjects.update(subject.id, {
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        code: form.code.trim() || null,
        color: form.color,
      });
      setEditOpen(false);
      await refresh();
      toast.success('Subject আপডেট হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const createChapter = async (form) => {
    setBusy(true);
    try {
      await api.chapters.create({
        subjectId: subject.id,
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        number: form.number === '' ? undefined : Number(form.number),
      });
      setAddChapterOpen(false);
      await refresh();
      toast.success('Chapter যোগ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteSubject = async () => {
    setBusy(true);
    try {
      await api.subjects.remove(subject.id);
      toast.success('Subject delete হয়েছে');
      await refresh();
      navigate('/subjects');
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link to="/subjects" className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800">
        <ArrowLeft className="h-3.5 w-3.5" /> সব subject
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full" style={{ backgroundColor: subject.color }} />
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-ink-900">{subject.name}</h2>
              <p className="muted">
                {subject.nameBn ? `${subject.nameBn} · ` : ''}
                {subject.chapters.length} chapter · {subject.progress.total} topic
                {subject.code ? ` · Code ${subject.code}` : ''}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setEditOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmOpen(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-t border-ink-100 p-4 sm:p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">Subject progress</span>
            <span className="text-lg font-semibold text-ink-900">{subject.progress.percent}%</span>
          </div>
          <ProgressBar value={subject.progress.percent} color={subject.color} size="lg" />
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <MiniStat label="শেষ topic" value={subject.progress.completed} />
            <MiniStat label="বাকি topic" value={subject.progress.remaining} />
            <MiniStat label="চলছে" value={subject.progress.studying} />
            <MiniStat label="Revision দরকার" value={subject.progress.needsRevision} />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Chapter"
          subtitle="প্রতিটি chapter-এর % তার topic থেকে হিসাব হয়"
          icon={BookOpen}
          action={
            <Button onClick={() => setAddChapterOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Chapter
            </Button>
          }
        />

        {subject.chapters.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="কোনো chapter নেই"
            description="নতুন chapter যোগ করুন, অথবা Import Chapter দিয়ে list paste করুন।"
            action={
              <Button className="mt-2" onClick={() => setAddChapterOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Chapter যোগ করুন
              </Button>
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {subject.chapters.map((chapter) => (
              <li key={chapter.id}>
                <Link
                  to={`/subjects/${subject.id}/chapters/${chapter.id}`}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-ink-50 sm:px-5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink-100 text-xs font-semibold text-ink-600">
                    {chapter.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-sm font-medium text-ink-900">{chapter.name}</span>
                      <span className="shrink-0 text-xs font-semibold text-ink-700">
                        {chapter.progress.percent}%
                      </span>
                    </div>
                    <div className="muted mt-0.5">
                      {chapter.progress.completed}/{chapter.progress.total} topic
                      {chapter.progress.needsRevision > 0 && ` · ${chapter.progress.needsRevision} revision দরকার`}
                      {chapter.progress.total === 0 && ' · topic যোগ করুন'}
                    </div>
                    <div className="mt-1.5">
                      <ProgressBar value={chapter.progress.percent} color={subject.color} size="sm" />
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-ink-400" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <SubjectFormModal open={editOpen} onClose={() => setEditOpen(false)} onSubmit={saveSubject} subject={subject} busy={busy} />
      <ChapterFormModal
        open={addChapterOpen}
        onClose={() => setAddChapterOpen(false)}
        onSubmit={createChapter}
        subjectName={subject.name}
        busy={busy}
      />
      <ConfirmDialog
        open={confirmOpen}
        title="Subject delete করবেন?"
        message={`"${subject.name}" এর সব chapter, topic আর note মুছে যাবে। এটা undo করা যাবে না।`}
        onConfirm={deleteSubject}
        onClose={() => setConfirmOpen(false)}
        busy={busy}
      />
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-xl bg-ink-50 px-3 py-2">
      <div className="text-[11px] text-ink-500">{label}</div>
      <div className="text-sm font-semibold text-ink-900">{value}</div>
    </div>
  );
}
