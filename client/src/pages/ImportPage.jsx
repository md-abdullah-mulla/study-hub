import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileInput, Wand2, CheckCircle2, AlertTriangle, Trash2, Plus } from 'lucide-react';
import { api } from '../api/client.js';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { Card, CardHeader, Button, EmptyState } from '../components/ui/index.jsx';

const SAMPLE = `Subject: IoT & IoT Architecture
Chapter: Chapter 2
Topics:
- Sensor types
- Actuator
- Edge devices
- Cloud services`;

/**
 * IMPORT CHAPTER (spec §22)
 * Paste a list → parse → preview → edit → apply.
 * The preview step exists so nothing is created by surprise.
 */
export default function ImportPage() {
  const { subjects, refresh } = useAppData();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [target, setTarget] = useState({ subjectId: '', chapterName: '', chapterNumber: '' });
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  const parse = async () => {
    setBusy(true);
    try {
      const result = await api.importParse(text);
      setParsed(result);
      const matched = subjects.find(
        (s) => s.name.toLowerCase() === (result.subjectName ?? '').toLowerCase()
      );
      setTarget({
        subjectId: matched ? String(matched.id) : '',
        chapterName: result.chapterName ?? '',
        chapterNumber: '',
      });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const apply = async () => {
    setBusy(true);
    try {
      const selected = subjects.find((s) => s.id === Number(target.subjectId));
      const result = await api.importApply({
        subjectId: selected?.id ?? null,
        subjectName: selected ? null : parsed.subjectName,
        chapterName: target.chapterName || parsed.chapterName,
        chapterNumber: target.chapterNumber ? Number(target.chapterNumber) : undefined,
        topics: parsed.topics,
      });
      toast.success(`${result.preview}${result.skippedCount ? ` (${result.skippedCount}টি আগে থেকেই ছিল)` : ''}`);
      setParsed(null);
      setText('');
      await refresh();
      navigate(`/subjects/${result.subject.id}/chapters/${result.chapter.id}`);
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
          title="Import Chapter"
          subtitle="Subject, Chapter আর Topic list paste করলে structure automatic তৈরি হবে"
          icon={FileInput}
        />

        <div className="space-y-4 p-4 sm:p-5">
          <div>
            <label className="label">এখানে paste করুন</label>
            <textarea
              rows={9}
              className="input font-mono text-xs leading-relaxed"
              placeholder={SAMPLE}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              <Button onClick={parse} disabled={busy || !text.trim()}>
                <Wand2 className="h-3.5 w-3.5" /> Structure তৈরি করুন
              </Button>
              <Button variant="ghost" onClick={() => setText(SAMPLE)}>
                উদাহরণ বসান
              </Button>
              {text && (
                <Button variant="ghost" onClick={() => { setText(''); setParsed(null); }}>
                  <Trash2 className="h-3.5 w-3.5" /> Clear
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-ink-200 bg-ink-50 p-3">
            <p className="text-xs font-medium text-ink-700">Format tips</p>
            <ul className="muted mt-1 list-inside list-disc space-y-0.5">
              <li>
                <code>Subject: IoT</code> — অথবা নিচের dropdown থেকে subject বেছে নিন
              </li>
              <li>
                <code>Chapter: Chapter 2</code> — নম্বরসহ লিখলে number automatic ধরা পড়বে
              </li>
              <li>
                <code>Topics:</code> এর নিচে প্রতি লাইনে একটি topic (bullet <code>-</code> বা নম্বর দিলেও চলবে)
              </li>
              <li>আগে থেকে থাকা topic duplicate হিসেবে skip হবে — কিছু মুছে যাবে না</li>
            </ul>
          </div>
        </div>
      </Card>

      {parsed && (
        <Card>
          <CardHeader
            title="Preview"
            subtitle="Save করার আগে দেখে নিন এবং দরকার হলে বদলে নিন"
            icon={CheckCircle2}
          />

          <div className="space-y-4 p-4 sm:p-5">
            {parsed.warnings?.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                {parsed.warnings.map((w) => (
                  <p key={w} className="flex items-start gap-1.5 text-xs text-amber-800">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {w}
                  </p>
                ))}
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="label">Subject</label>
                <select
                  className="input"
                  value={target.subjectId}
                  onChange={(e) => setTarget({ ...target, subjectId: e.target.value })}
                >
                  <option value="">
                    নতুন subject তৈরি হবে: “{parsed.subjectName ?? 'নাম দেওয়া হয়নি'}”
                  </option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Chapter no.</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  placeholder="auto"
                  value={target.chapterNumber}
                  onChange={(e) => setTarget({ ...target, chapterNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="label">Chapter name</label>
                <input
                  className="input"
                  value={target.chapterName}
                  onChange={(e) => setTarget({ ...target, chapterName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="label mb-0">Topics ({parsed.topics.length}টি)</span>
                <button
                  onClick={() => setParsed({ ...parsed, topics: [...parsed.topics, ''] })}
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline"
                >
                  <Plus className="h-3 w-3" /> আরেকটি
                </button>
              </div>
              <ul className="space-y-2">
                {parsed.topics.map((topic, index) => (
                  <li key={`${topic}-${index}`} className="flex items-center gap-2">
                    <span className="w-6 shrink-0 text-right text-xs text-ink-400">{index + 1}.</span>
                    <input
                      className="input"
                      value={topic}
                      onChange={(e) => {
                        const topics = [...parsed.topics];
                        topics[index] = e.target.value;
                        setParsed({ ...parsed, topics });
                      }}
                    />
                    <button
                      onClick={() =>
                        setParsed({ ...parsed, topics: parsed.topics.filter((_, i) => i !== index) })
                      }
                      className="rounded-lg p-1.5 text-ink-400 hover:bg-red-50 hover:text-red-600"
                      aria-label="সরান"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-ink-100 pt-4">
              <Button variant="ghost" onClick={() => setParsed(null)}>
                বাতিল
              </Button>
              <Button onClick={apply} disabled={busy || parsed.topics.filter(Boolean).length === 0}>
                Save করুন ({parsed.topics.filter(Boolean).length}টি topic)
              </Button>
            </div>
          </div>
        </Card>
      )}

      {!parsed && (
        <EmptyState
          icon={FileInput}
          title="কীভাবে কাজ করে?"
          description="বইয়ের যেকোনো chapter-এর topic list কপি করে উপরে paste করুন — বিষয়, chapter আর topic আলাদা করে চিনে নেবে। তারপর preview থেকে Save করলেই শেষ।"
        />
      )}
    </div>
  );
}
