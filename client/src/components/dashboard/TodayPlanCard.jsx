import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Plus, RotateCw, Trash2, Check } from 'lucide-react';
import { Card, CardHeader, Button, Modal, EmptyState } from '../ui/index.jsx';
import { api } from '../../api/client.js';
import { useToast } from '../../state/ToastContext.jsx';
import { useAppData } from '../../state/AppDataContext.jsx';

/**
 * TODAY'S TARGET (spec §11)
 * Auto-built from progress data, but fully editable: tick, delete, add your own,
 * or regenerate the suggestion.
 */
export function TodayPlanCard({ plan }) {
  const { subjects, refresh } = useAppData();
  const [addOpen, setAddOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [newItem, setNewItem] = useState({ subjectId: '', chapterId: '', kind: 'study', title: '' });
  const toast = useToast();

  const selectedSubject = subjects.find((s) => s.id === Number(newItem.subjectId));

  const toggleDone = async (item) => {
    try {
      await api.plan.setDone(item.id, !item.isDone);
      await refresh();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const removeItem = async (id) => {
    try {
      await api.plan.remove(id);
      await refresh();
      toast.success('তালিকা থেকে সরানো হয়েছে');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const regenerate = async () => {
    setBusy(true);
    try {
      await api.plan.regenerate();
      await refresh();
      toast.success('আজকের target আবার তৈরি হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addItem = async () => {
    const chapter = selectedSubject?.chapters.find((c) => c.id === Number(newItem.chapterId));
    const title =
      newItem.title.trim() ||
      (chapter ? `${selectedSubject.name} → Chapter ${chapter.number}: ${chapter.name}` : '');
    if (!title) {
      toast.error('কী পড়বেন সেটা লিখুন বা chapter বেছে নিন');
      return;
    }
    setBusy(true);
    try {
      await api.plan.add({
        title,
        kind: newItem.kind,
        subjectId: selectedSubject?.id ?? null,
        chapterId: chapter?.id ?? null,
      });
      setAddOpen(false);
      setNewItem({ subjectId: '', chapterId: '', kind: 'study', title: '' });
      await refresh();
      toast.success('Target যোগ হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const done = plan.filter((p) => p.isDone).length;

  return (
    <Card>
      <CardHeader
        title="Today's Target"
        subtitle={plan.length ? `${done}/${plan.length} শেষ` : undefined}
        icon={Target}
        action={
          <div className="flex items-center gap-1">
            <button
              onClick={regenerate}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-600 hover:bg-ink-100 disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${busy ? 'animate-spin' : ''}`} /> আবার তৈরি
            </button>
            <button
              onClick={() => setAddOpen(true)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-brand-600 hover:bg-brand-50"
            >
              <Plus className="h-3.5 w-3.5" /> যোগ
            </button>
          </div>
        }
      />

      {plan.length === 0 ? (
        <EmptyState
          icon={Target}
          title="আজকের জন্য কিছু নেই"
          description="“আবার তৈরি” চাপলে তোমার progress দেখে পরিকল্পনা বানিয়ে দেবে।"
        />
      ) : (
        <ul className="divide-y divide-ink-100">
          {plan.map((item) => (
            <li key={item.id} className="flex items-start gap-3 px-4 py-3 sm:px-5">
              <button
                onClick={() => toggleDone(item)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                  item.isDone ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-ink-300 bg-white hover:border-brand-500'
                }`}
                aria-label={item.isDone ? 'Not done' : 'Done'}
              >
                {item.isDone && <Check className="h-3.5 w-3.5" />}
              </button>

              <div className="min-w-0 flex-1">
                <div
                  className={`text-sm ${
                    item.isDone ? 'text-ink-400 line-through' : 'font-medium text-ink-900'
                  }`}
                >
                  {item.title}
                </div>
                <div className="muted mt-0.5 flex items-center gap-2">
                  <span
                    className={`chip ${
                      item.kind === 'revision'
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-brand-50 text-brand-600'
                    }`}
                  >
                    {item.kind === 'revision' ? 'Revision' : 'Study'}
                  </span>
                  {item.chapterId && (
                    <Link
                      to={`/subjects/${item.subjectId}/chapters/${item.chapterId}`}
                      className="text-brand-600 hover:underline"
                    >
                      খুলুন
                    </Link>
                  )}
                </div>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                aria-label="সরান"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={addOpen}
        title="আজকের target যোগ করুন"
        onClose={() => setAddOpen(false)}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAddOpen(false)}>
              বাতিল
            </Button>
            <Button onClick={addItem} disabled={busy}>
              যোগ করুন
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="label">Subject</label>
            <select
              className="input"
              value={newItem.subjectId}
              onChange={(e) => setNewItem({ ...newItem, subjectId: e.target.value, chapterId: '' })}
            >
              <option value="">— বেছে নিন —</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {selectedSubject && (
            <div>
              <label className="label">Chapter</label>
              <select
                className="input"
                value={newItem.chapterId}
                onChange={(e) => setNewItem({ ...newItem, chapterId: e.target.value })}
              >
                <option value="">— (ঐচ্ছিক) —</option>
                {selectedSubject.chapters.map((c) => (
                  <option key={c.id} value={c.id}>
                    Chapter {c.number}: {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="label">ধরন</label>
            <select
              className="input"
              value={newItem.kind}
              onChange={(e) => setNewItem({ ...newItem, kind: e.target.value })}
            >
              <option value="study">নতুন পড়া</option>
              <option value="revision">Revision</option>
            </select>
          </div>

          <div>
            <label className="label">নিজের লেখা (ঐচ্ছিক)</label>
            <input
              className="input"
              placeholder="যেমন: MQTT আর CoAP আবার পড়ব"
              value={newItem.title}
              onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </Card>
  );
}
