import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SearchX } from 'lucide-react';
import { api } from '../../api/client.js';
import { Modal } from '../ui/index.jsx';

/**
 * GLOBAL SEARCH (spec §20)
 * Searches subjects, chapters, topics, notes and AI content.
 * Opens with the search icon, ⌘K / Ctrl+K, or "/" key.
 */
export function SearchDialog({ open, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setQuery('');
      setResults(null);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  // debounce typing so we do not hammer the API
  useEffect(() => {
    if (!open) return undefined;
    const term = query.trim();
    if (!term) {
      setResults(null);
      return undefined;
    }
    setBusy(true);
    const timer = setTimeout(async () => {
      try {
        setResults(await api.search(term));
      } catch {
        setResults(null);
      } finally {
        setBusy(false);
      }
    }, 220);
    return () => clearTimeout(timer);
  }, [query, open]);

  const groups = useMemo(() => {
    if (!results) return [];
    return [
      {
        key: 'topics',
        label: 'Topic',
        items: results.topics?.map((t) => ({
          id: `t-${t.id}`,
          title: t.name,
          meta: `${t.subjectName} · Chapter ${t.chapterNumber}: ${t.chapterName}`,
          to: `/subjects/${t.subjectId}/chapters/${t.chapterId}`,
        })),
      },
      {
        key: 'subjects',
        label: 'Subject',
        items: results.subjects?.map((s) => ({
          id: `s-${s.id}`,
          title: s.name,
          meta: s.nameBn ?? '',
          to: `/subjects/${s.id}`,
        })),
      },
      {
        key: 'chapters',
        label: 'Chapter',
        items: results.chapters?.map((c) => ({
          id: `c-${c.id}`,
          title: `Chapter ${c.number}: ${c.name}`,
          meta: c.subjectName,
          to: `/subjects/${c.subjectId}/chapters/${c.id}`,
        })),
      },
      {
        key: 'notes',
        label: 'Note',
        items: results.notes?.map((n) => ({
          id: `n-${n.id}`,
          title: n.title ?? n.body.slice(0, 60),
          meta: `${n.source === 'ai' ? 'AI note' : 'Personal note'} · ${n.topicName}`,
          to: n.chapterId ? `/subjects/${n.subjectId}/chapters/${n.chapterId}` : '/notes',
        })),
      },
    ].filter((g) => g.items?.length);
  }, [results]);

  const go = (to) => {
    onClose?.();
    navigate(to);
  };

  return (
    <Modal open={open} title="Global Search" onClose={onClose} size="lg">
      <div className="flex items-center gap-2 rounded-xl border border-ink-200 px-3 py-2 focus-within:border-brand-500">
        <Search className="h-4 w-4 text-ink-400" />
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="যেমন: MQTT, DBMS, RDBMS..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-ink-400"
        />
        {busy && <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-ink-200 border-t-brand-600" />}
      </div>

      <div className="mt-3 max-h-[55vh] space-y-4 overflow-y-auto">
        {!query.trim() && (
          <p className="muted px-1">
            Subject, chapter, topic, note — সব কিছু একসাথে search করা যায়। Enter চাপলে প্রথম ফলাফলে যাবে।
          </p>
        )}

        {query.trim() && results?.total === 0 && (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <SearchX className="h-6 w-6 text-ink-400" />
            <p className="text-sm text-ink-600">“{query}” এর জন্য কিছু পাওয়া যায়নি।</p>
            <p className="muted">বানান একটু বদলে দেখুন, অথবা নতুন topic import করুন।</p>
          </div>
        )}

        {groups.map((group) => (
          <div key={group.key}>
            <div className="mb-1.5 px-1 text-[11px] font-semibold uppercase tracking-wide text-ink-500">
              {group.label}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => go(item.to)}
                    className="w-full rounded-xl px-3 py-2 text-left hover:bg-ink-50"
                  >
                    <div className="text-sm font-medium text-ink-900">{item.title}</div>
                    {item.meta && <div className="muted">{item.meta}</div>}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Modal>
  );
}
