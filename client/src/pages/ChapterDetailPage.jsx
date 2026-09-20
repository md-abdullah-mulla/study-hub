import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Pencil, Trash2, ListTree, CheckCheck } from 'lucide-react';
import { api } from '../api/client.js';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { Card, CardHeader, Button, EmptyState, ConfirmDialog } from '../components/ui/index.jsx';
import { ProgressBar } from '../components/ui/ProgressBar.jsx';
import { TopicRow } from '../components/topic/TopicRow.jsx';
import { ChapterFormModal, TopicFormModal } from '../components/forms/Forms.jsx';

/** stable empty array: keeps the `topics` reference stable for useMemo */
const EMPTY_TOPICS = [];

/**
 * CHAPTER & TOPIC screen (spec §7, §8, §23)
 * Topic status is edited here; chapter/subject/semester percentages update
 * automatically because they are all derived from these topics.
 */
export default function ChapterDetailPage() {
  const { subjectId, chapterId } = useParams();
  const navigate = useNavigate();
  const { findSubject, findChapter, refresh } = useAppData();
  const subject = findSubject(subjectId);
  const chapter = findChapter(subjectId, chapterId);

  const [addTopicOpen, setAddTopicOpen] = useState(false);
  const [editChapterOpen, setEditChapterOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const topics = chapter?.topics ?? EMPTY_TOPICS;
  const remaining = useMemo(() => topics.filter((t) => !t.isDone), [topics]);

  if (!subject || !chapter) {
    return (
      <EmptyState
        title="Chapter পাওয়া যায়নি"
        description="হয়তো delete করা হয়েছে।"
        action={
          <Link to="/subjects" className="btn-ghost mt-2">
            Subject list-এ ফিরে যান
          </Link>
        }
      />
    );
  }

  const addTopic = async (form) => {
    setBusy(true);
    try {
      await api.topics.create({
        chapterId: chapter.id,
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        description: form.description.trim() || null,
        importance: form.importance,
      });
      setAddTopicOpen(false);
      await refresh();
      toast.success('Topic যোগ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveChapter = async (form) => {
    setBusy(true);
    try {
      await api.chapters.update(chapter.id, {
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        number: form.number === '' ? undefined : Number(form.number),
      });
      setEditChapterOpen(false);
      await refresh();
      toast.success('Chapter আপডেট হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteChapter = async () => {
    setBusy(true);
    try {
      await api.chapters.remove(chapter.id);
      toast.success('Chapter delete হয়েছে');
      await refresh();
      navigate(`/subjects/${subject.id}`);
    } catch (err) {
      toast.error(err.message);
      setBusy(false);
    }
  };

  const markAllCompleted = async () => {
    setBusy(true);
    try {
      await api.chapters.bulkStatus(subject.id, chapter.id, 'completed');
      setBulkOpen(false);
      await refresh();
      toast.success('সব topic complete হিসেবে set হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Link
        to={`/subjects/${subject.id}`}
        className="inline-flex items-center gap-1 text-xs font-medium text-ink-500 hover:text-ink-800"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> {subject.name}
      </Link>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-3 p-4 sm:p-5">
          <div className="min-w-0">
            <p className="muted">{subject.name}</p>
            <h2 className="text-lg font-semibold text-ink-900">
              Chapter {chapter.number}: {chapter.name}
            </h2>
            {chapter.nameBn && <p className="muted mt-0.5">{chapter.nameBn}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost" onClick={() => setBulkOpen(true)}>
              <CheckCheck className="h-3.5 w-3.5" /> সব complete
            </Button>
            <Button variant="ghost" onClick={() => setEditChapterOpen(true)}>
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Button>
            <Button variant="danger" onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="border-t border-ink-100 p-4 sm:p-5">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-ink-700">
              Chapter progress ({chapter.progress.completed}/{chapter.progress.total} topic)
            </span>
            <span className="text-lg font-semibold text-ink-900">{chapter.progress.percent}%</span>
          </div>
          <ProgressBar value={chapter.progress.percent} color={subject.color} size="lg" />
          <div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span>চলছে: {chapter.progress.studying}</span>
            <span>শুরু করিনি: {chapter.progress.notStarted}</span>
            <span>Revision দরকার: {chapter.progress.needsRevision}</span>
            {topics.find((t) => t.lastStudiedAt) && (
              <span>শেষ পড়া: {new Date(topics.find((t) => t.lastStudiedAt).lastStudiedAt).toLocaleDateString()}</span>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Topic list"
          subtitle="প্রতিটি topic-এর status বদলালে উপরের % সাথে সাথে বদলাবে"
          icon={ListTree}
          action={
            <Button onClick={() => setAddTopicOpen(true)}>
              <Plus className="h-3.5 w-3.5" /> Topic
            </Button>
          }
        />

        {topics.length === 0 ? (
          <EmptyState
            icon={ListTree}
            title="কোনো topic নেই"
            description="Topic যোগ করুন অথবা Import page থেকে list paste করুন।"
            action={
              <Button className="mt-2" onClick={() => setAddTopicOpen(true)}>
                <Plus className="h-3.5 w-3.5" /> Topic যোগ করুন
              </Button>
            }
          />
        ) : (
          <div>
            {topics.map((topic) => (
              <TopicRow key={topic.id} topic={topic} onChanged={refresh} onDeleted={refresh} />
            ))}
            {remaining.length > 0 && (
              <p className="muted px-4 py-3">
                এই chapter-এ আরও {remaining.length}টি topic বাকি — {remaining[0].name} দিয়ে শুরু করতে পারো।
              </p>
            )}
          </div>
        )}
      </Card>

      <TopicFormModal
        open={addTopicOpen}
        onClose={() => setAddTopicOpen(false)}
        onSubmit={addTopic}
        chapterName={`Chapter ${chapter.number}`}
        busy={busy}
      />
      <ChapterFormModal
        open={editChapterOpen}
        onClose={() => setEditChapterOpen(false)}
        onSubmit={saveChapter}
        chapter={chapter}
        busy={busy}
      />
      <ConfirmDialog
        open={confirmDelete}
        title="Chapter delete করবেন?"
        message={`Chapter ${chapter.number}: ${chapter.name} এবং এর ${topics.length}টি topic মুছে যাবে।`}
        onConfirm={deleteChapter}
        onClose={() => setConfirmDelete(false)}
        busy={busy}
      />
      <ConfirmDialog
        open={bulkOpen}
        title="সব topic complete করবেন?"
        message={`${topics.length}টি topic-ই complete হিসেবে set হবে এবং revision schedule তৈরি হবে।`}
        confirmLabel="হ্যাঁ, complete"
        onConfirm={markAllCompleted}
        onClose={() => setBulkOpen(false)}
        busy={busy}
      />
    </div>
  );
}
