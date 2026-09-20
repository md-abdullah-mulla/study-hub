import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { NotebookPen, Pencil, Save, Trash2 } from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, EmptyState, Button } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { formatDateShort } from '../lib/format.js';

/** All personal notes in one place, searchable and editable (spec §21). */
export default function NotesPage() {
  const { subjects, refresh } = useAppData();
  const [notes, setNotes] = useState([]);
  const [source, setSource] = useState('personal');
  const [query, setQuery] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  // notes endpoint returns raw rows; enrich with topic → chapter path from the tree
  const load = async () => {
    try {
      const rows = await api.notes.list();
      setNotes(rows);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const topicIndex = useMemo(() => {
    const map = new Map();
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        for (const topic of chapter.topics) {
          map.set(topic.id, { subject, chapter, topic });
        }
      }
    }
    return map;
  }, [subjects]);

  const visible = useMemo(() => {
    const term = query.trim().toLowerCase();
    return notes
      .filter((n) => n.source === source)
      .filter((n) => (term ? n.body.toLowerCase().includes(term) || (n.title ?? '').toLowerCase().includes(term) : true))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [notes, source, query]);

  const save = async (id) => {
    setBusy(true);
    try {
      await api.notes.update(id, { body: draft });
      setEditingId(null);
      await load();
      await refresh();
      toast.success('নোট আপডেট হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    try {
      await api.notes.remove(id);
      await load();
      toast.success('নোট delete হয়েছে');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Notes"
          subtitle="Personal note আর AI note আলাদা রাখা আছে"
          icon={NotebookPen}
        />

        <div className="flex flex-col gap-3 border-b border-ink-100 p-4 sm:flex-row sm:items-center sm:p-5">
          <div className="inline-flex rounded-xl border border-ink-200 p-0.5">
            {[
              { key: 'personal', label: 'আমার নোট' },
              { key: 'ai', label: 'AI note' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setSource(tab.key)}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  source === tab.key ? 'bg-brand-600 text-white' : 'text-ink-600 hover:bg-ink-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <input
            className="input flex-1"
            placeholder="নোটের ভেতরে খুঁজুন..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        {visible.length === 0 ? (
          <EmptyState
            icon={NotebookPen}
            title={source === 'personal' ? 'কোনো personal note নেই' : 'কোনো AI note নেই'}
            description={
              source === 'personal'
                ? 'যেকোনো topic খুলে নোট লিখলে সেটা এখানে জমা হবে।'
                : 'AI content generation Phase 4-এ যুক্ত হবে — তখন AI note এখানে দেখা যাবে।'
            }
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {visible.map((note) => {
              const path = topicIndex.get(note.topicId);
              return (
                <li key={note.id} className="px-4 py-3 sm:px-5">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    {path ? (
                      <Link
                        to={`/subjects/${path.subject.id}/chapters/${path.chapter.id}`}
                        className="text-xs font-medium text-brand-600 hover:underline"
                      >
                        {path.subject.name} · Chapter {path.chapter.number} · {path.topic.name}
                      </Link>
                    ) : (
                      <span className="muted">Topic পাওয়া যায়নি</span>
                    )}
                    <span className="muted">· {formatDateShort(note.updatedAt)}</span>
                  </div>

                  {editingId === note.id ? (
                    <>
                      <textarea
                        rows={4}
                        className="input resize-y"
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button variant="ghost" onClick={() => setEditingId(null)}>
                          বাতিল
                        </Button>
                        <Button onClick={() => save(note.id)} disabled={busy}>
                          <Save className="h-3.5 w-3.5" /> Save
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="whitespace-pre-wrap text-sm text-ink-700">{note.body}</p>
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(note.id);
                            setDraft(note.body);
                          }}
                          className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
                          aria-label="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => remove(note.id)}
                          className="rounded-lg p-1.5 text-red-500 hover:bg-red-50"
                          aria-label="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
