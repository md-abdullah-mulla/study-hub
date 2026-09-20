import { useCallback, useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, Save, Sparkles } from 'lucide-react';
import { api } from '../../api/client.js';
import { Button } from '../ui/index.jsx';
import { useToast } from '../../state/ToastContext.jsx';
import { formatDateShort } from '../../lib/format.js';

/**
 * Personal notes for one topic (spec §21).
 * Personal notes and AI notes stay in separate sections — AI notes arrive in
 * Phase 4 and will appear in the lower block without mixing with your own text.
 */
export function TopicNotes({ topicId }) {
  const [notes, setNotes] = useState({ personal: [], ai: [] });
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editBody, setEditBody] = useState('');
  const [busy, setBusy] = useState(false);
  const toast = useToast();

  const load = useCallback(async () => {
    const all = await api.notes.list({ topicId });
    setNotes({
      personal: all.filter((n) => n.source === 'personal'),
      ai: all.filter((n) => n.source === 'ai'),
    });
  }, [topicId]);

  useEffect(() => {
    load().catch(() => toast.error('নোট লোড করা যায়নি'));
  }, [load, toast]);

  const addNote = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    try {
      await api.notes.create({ topicId, body: draft.trim() });
      setDraft('');
      await load();
      toast.success('নোট save হয়েছে');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const saveEdit = async (id) => {
    setBusy(true);
    try {
      await api.notes.update(id, { body: editBody });
      setEditingId(null);
      await load();
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
    <div className="space-y-3">
      <div>
        <label className="label" htmlFor={`note-${topicId}`}>
          আমার নোট
        </label>
        <textarea
          id={`note-${topicId}`}
          rows={3}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="নিজের ভাষায় লিখে রাখো — পরে revision-এ কাজে দিবে..."
          className="input resize-y"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={addNote} disabled={busy || !draft.trim()}>
            <Plus className="h-3.5 w-3.5" /> নোট যোগ করুন
          </Button>
        </div>
      </div>

      {notes.personal.length === 0 ? (
        <p className="muted">এখনো কোনো personal note নেই।</p>
      ) : (
        <ul className="space-y-2">
          {notes.personal.map((note) => (
            <li key={note.id} className="rounded-xl border border-ink-200 bg-ink-50 p-3">
              {editingId === note.id ? (
                <>
                  <textarea
                    rows={3}
                    className="input resize-y"
                    value={editBody}
                    onChange={(e) => setEditBody(e.target.value)}
                  />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setEditingId(null)}>
                      বাতিল
                    </Button>
                    <Button onClick={() => saveEdit(note.id)} disabled={busy}>
                      <Save className="h-3.5 w-3.5" /> Save
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="whitespace-pre-wrap text-sm text-ink-700">{note.body}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="muted">{formatDateShort(note.updatedAt)}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setEditingId(note.id);
                          setEditBody(note.body);
                        }}
                        className="rounded-lg p-1.5 text-ink-500 hover:bg-white"
                        aria-label="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => remove(note.id)}
                        className="rounded-lg p-1.5 text-red-500 hover:bg-white"
                        aria-label="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-xl border border-dashed border-ink-200 p-3">
        <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-600">
          <Sparkles className="h-3.5 w-3.5 text-brand-500" /> AI generated note
        </div>
        {notes.ai.length === 0 ? (
          <p className="muted">
            AI explanation / summary এখানে আলাদা করে দেখা যাবে — Phase 4-এ যুক্ত হবে।
          </p>
        ) : (
          <ul className="space-y-2">
            {notes.ai.map((note) => (
              <li key={note.id} className="rounded-lg bg-brand-50 p-2.5 text-sm text-ink-700">
                {note.body}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

