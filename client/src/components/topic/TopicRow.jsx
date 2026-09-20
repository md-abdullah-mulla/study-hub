import { useState } from 'react';
import { ChevronDown, Pencil, Trash2, RotateCcw, AlertCircle } from 'lucide-react';
import { TopicStatusPicker, TopicStatusBadge } from './TopicStatusPicker.jsx';
import { TopicNotes } from './TopicNotes.jsx';
import { Modal, Button, ConfirmDialog } from '../ui/index.jsx';
import { REVISION_STAGE_LABEL, IMPORTANCE_LABEL } from '../../lib/status.js';
import { relativeDays, daysSince, formatDateShort } from '../../lib/format.js';
import { api } from '../../api/client.js';
import { useToast } from '../../state/ToastContext.jsx';

/**
 * One topic line: status buttons, revision badge, expandable notes and
 * edit/delete actions. All progress changes go to the API, then the parent
 * refreshes so every percentage on screen stays correct.
 */
export function TopicRow({ topic, onChanged, onDeleted, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [form, setForm] = useState({
    name: topic.name,
    nameBn: topic.nameBn ?? '',
    description: topic.description ?? '',
    importance: topic.importance,
  });
  const toast = useToast();

  const revisionDue = topic.revisionDue || topic.status === 'needs_revision';

  const changeStatus = async (status) => {
    if (status === topic.status) return;
    setBusy(true);
    try {
      await api.topics.setStatus(topic.id, status);
      await onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const completeRevision = async () => {
    setBusy(true);
    try {
      const updated = await api.topics.completeRevision(topic.id);
      toast.success(`Revision save হয়েছে → ${REVISION_STAGE_LABEL[updated.revisionStage]}`);
      await onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async () => {
    setBusy(true);
    try {
      await api.topics.update(topic.id, {
        name: form.name.trim(),
        nameBn: form.nameBn.trim() || null,
        description: form.description.trim() || null,
        importance: form.importance,
      });
      setEditOpen(false);
      toast.success('Topic আপডেট হয়েছে');
      await onChanged?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const removeTopic = async () => {
    setBusy(true);
    try {
      await api.topics.remove(topic.id);
      toast.success('Topic delete হয়েছে');
      setConfirmOpen(false);
      await onDeleted?.();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-b border-ink-100 last:border-0">
      <div className="flex items-start gap-3 px-3 py-2.5 sm:px-4">
        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-1 rounded-lg p-1 text-ink-400 hover:bg-ink-100"
          aria-label="বিস্তারিত"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`text-sm font-medium ${
                topic.status === 'completed' || topic.status === 'needs_revision'
                  ? 'text-ink-500 line-through decoration-ink-300'
                  : 'text-ink-900'
              }`}
            >
              {topic.name}
            </span>
            {topic.importance === 'high' && (
              <span className="chip bg-rose-50 text-rose-600">বেশি গুরুত্ব</span>
            )}
            {revisionDue && (
              <span className="chip bg-rose-100 text-rose-700">
                <AlertCircle className="h-3 w-3" /> Revision due
              </span>
            )}
            {!revisionDue && topic.revisionStage !== 'none' && (
              <span className="chip bg-ink-100 text-ink-600">
                {REVISION_STAGE_LABEL[topic.revisionStage]}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-ink-500">
            <span className="sm:hidden">
              <TopicStatusBadge status={topic.status} />
            </span>
            <span>
              শেষ পড়া: {topic.lastStudiedAt ? relativeDays(daysSince(topic.lastStudiedAt)) : 'কখনো না'}
            </span>
            {topic.completedAt && <span>Complete: {formatDateShort(topic.completedAt)}</span>}
            {topic.nextRevisionAt && <span>Next revision: {formatDateShort(topic.nextRevisionAt)}</span>}
            {topic.revisionCount > 0 && <span>Revision: {topic.revisionCount} বার</span>}
            {topic.confidence ? <span>Confidence: {topic.confidence}/5</span> : null}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <TopicStatusPicker value={topic.status} onChange={changeStatus} disabled={busy} />
          <button
            onClick={() => {
              setForm({
                name: topic.name,
                nameBn: topic.nameBn ?? '',
                description: topic.description ?? '',
                importance: topic.importance,
              });
              setEditOpen(true);
            }}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600"
            aria-label="Topic edit"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Topic delete"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="space-y-3 bg-ink-50/60 px-4 pb-4 pt-3 sm:pl-12">
          {topic.description && (
            <p className="rounded-xl border border-ink-200 bg-white p-3 text-sm text-ink-700">
              {topic.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <TopicStatusPicker value={topic.status} onChange={changeStatus} disabled={busy} />
            {topic.status === 'needs_revision' && (
              <Button variant="ghost" onClick={completeRevision} disabled={busy}>
                <RotateCcw className="h-3.5 w-3.5" /> Revision complete
              </Button>
            )}
          </div>

          <TopicNotes topicId={topic.id} />
        </div>
      )}

      <Modal
        open={editOpen}
        title="Topic edit"
        onClose={() => setEditOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={saveEdit} disabled={busy || !form.name.trim()}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Topic name</label>
            <input
              className="input"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div>
            <label className="label">বাংলা নাম (ঐচ্ছিক)</label>
            <input
              className="input"
              value={form.nameBn}
              onChange={(e) => setForm({ ...form, nameBn: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea
              rows={3}
              className="input resize-y"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="label">গুরুত্ব</label>
            <select
              className="input"
              value={form.importance}
              onChange={(e) => setForm({ ...form, importance: e.target.value })}
            >
              {Object.entries(IMPORTANCE_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirmOpen}
        title="Topic delete করবেন?"
        message={`"${topic.name}" এবং এর সব note মুছে যাবে। এটা undo করা যাবে না।`}
        onConfirm={removeTopic}
        onClose={() => setConfirmOpen(false)}
        busy={busy}
      />
    </div>
  );
}
