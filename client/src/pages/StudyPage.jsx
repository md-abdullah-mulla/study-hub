import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpenCheck,
  Clock,
  Flame,
  PauseCircle,
  Play,
  Timer,
  Trash2,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import { api } from '../api/client.js';
import { Card, CardHeader, Button, Badge, StatCard, EmptyState, Spinner } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';
import { minutesLabel, formatDateShort } from '../lib/format.js';

/**
 * Study Session Tracker (Phase 2).
 *
 * Start -> finish a sitting. Only real measured time is saved, so the numbers
 * on the dashboard can never be invented. Finishing a session never marks a
 * topic "completed" by itself — the student decides that.
 */
const formatClock = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const seconds = total % 60;
  const pad = (value) => String(value).padStart(2, '0');
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`;
};

const CONFIDENCE_LABELS = ['', 'দুর্বল', 'কম', 'মাঝারি', 'ভালো', 'খুব ভালো'];

export default function StudyPage() {
  const { subjects, refresh } = useAppData();
  const toast = useToast();

  const [active, setActive] = useState([]);
  const [history, setHistory] = useState({ sessions: [], summary: null });
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());

  // picker
  const [subjectId, setSubjectId] = useState('');
  const [chapterId, setChapterId] = useState('');
  const [topicId, setTopicId] = useState('');

  // finish form
  const [form, setForm] = useState({ durationMinutes: '', confidence: 0, topicsCompleted: 0, revisionNeeded: false, note: '' });
  const [busy, setBusy] = useState(false);

  const load = async ({ silent = false } = {}) => {
    if (!silent) setLoading(true);
    try {
      const [open, list] = await Promise.all([api.sessions.active(), api.sessions.list({ limit: 10 })]);
      setActive(open);
      setHistory(list);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // live clock — only ticks while a session is open
  useEffect(() => {
    if (!active.length) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [active.length]);

  const current = active[0] ?? null;
  const elapsedMs = current ? now - new Date(current.startedAt).getTime() : 0;

  const currentSubject = useMemo(
    () => subjects.find((s) => s.id === current?.subjectId) ?? null,
    [subjects, current]
  );
  const currentChapter = currentSubject?.chapters.find((c) => c.id === current?.chapterId) ?? null;

  const pickerSubject = useMemo(() => subjects.find((s) => s.id === Number(subjectId)) ?? null, [subjects, subjectId]);
  const pickerChapter = useMemo(
    () => pickerSubject?.chapters.find((c) => c.id === Number(chapterId)) ?? null,
    [pickerSubject, chapterId]
  );

  // sensible default: the first topic that is not finished yet
  useEffect(() => {
    if (current || subjectId || !subjects.length) return;
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const topic = chapter.topics.find((t) => t.status !== 'completed');
        if (topic) {
          setSubjectId(String(subject.id));
          setChapterId(String(chapter.id));
          setTopicId(String(topic.id));
          return;
        }
      }
    }
  }, [subjects, subjectId, current]);

  // keep the chapter/topic in step with the subject that is selected
  useEffect(() => {
    if (!pickerSubject) return;
    if (!pickerSubject.chapters.some((c) => c.id === Number(chapterId))) {
      const first = pickerSubject.chapters[0];
      setChapterId(first ? String(first.id) : '');
      setTopicId(first?.topics[0] ? String(first.topics[0].id) : '');
    }
  }, [pickerSubject, chapterId]);

  useEffect(() => {
    if (!pickerChapter) return;
    if (!pickerChapter.topics.some((t) => t.id === Number(topicId))) {
      setTopicId(pickerChapter.topics[0] ? String(pickerChapter.topics[0].id) : '');
    }
  }, [pickerChapter, topicId]);

  const start = async () => {
    setBusy(true);
    try {
      await api.sessions.start(topicId ? { topicId: Number(topicId) } : { subjectId: Number(subjectId) || undefined });
      toast.success('পড়া শুরু হলো — টাইমার চলছে');
      await load({ silent: true });
      await refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const openFinish = () => {
    // pre-fill with the measured time, but the student can correct it
    const measured = Math.max(0, Math.round(elapsedMs / 60000));
    setForm({ durationMinutes: String(measured), confidence: 0, topicsCompleted: 0, revisionNeeded: false, note: '' });
  };

  const finish = async () => {
    if (!current) return;
    setBusy(true);
    try {
      const saved = await api.sessions.finish(current.id, {
        durationMinutes: Number(form.durationMinutes) || 0,
        confidence: form.confidence || null,
        topicsCompleted: Number(form.topicsCompleted) || 0,
        revisionNeeded: Boolean(form.revisionNeeded),
        note: form.note.trim() || null,
      });
      toast.success(`${saved.durationMinutes} মিনিট study time সেভ হলো`);
      setForm({ durationMinutes: '', confidence: 0, topicsCompleted: 0, revisionNeeded: false, note: '' });
      await load({ silent: true });
      await refresh();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await api.sessions.remove(current.id);
      toast.success('সেশনটা বাদ দেওয়া হলো — কোনো study time যোগ হয়নি');
      await load({ silent: true });
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const removeSession = async (session) => {
    try {
      await api.sessions.remove(session.id);
      await load({ silent: true });
      await refresh();
      toast.success('সেশন মুছে ফেলা হলো');
    } catch (error) {
      toast.error(error.message);
    }
  };

  const summary = history.summary;
  const recent = history.sessions;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="আজ পড়েছি" value={minutesLabel(summary?.todayMinutes ?? 0)} hint={`${summary?.activeDays ?? 0} দিন পড়া হয়েছে`} icon={Clock} tone="brand" />
        <StatCard label="মোট Study Time" value={minutesLabel(summary?.totalMinutes ?? 0)} icon={Timer} />
        <StatCard label="Current Streak" value={`${summary?.currentStreak ?? 0} দিন`} icon={Flame} tone="warn" />
        <StatCard label="Longest Streak" value={`${summary?.longestStreak ?? 0} দিন`} />
      </div>

      {current ? (
        <Card>
          <CardHeader
            title="এখন পড়ছি"
            subtitle="টাইমার চলছে — পড়া শেষ হলে নিচে সময় আর confidence দিয়ে সেভ করো"
            icon={BookOpenCheck}
            action={<Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">চলছে</Badge>}
          />
          <div className="space-y-4 p-4 sm:p-5">
            <div>
              <div className="text-3xl font-semibold tracking-tight text-ink-900 tabular-nums sm:text-4xl">
                {formatClock(elapsedMs)}
              </div>
              <p className="muted mt-1">
                {currentSubject?.name ?? 'Subject'}
                {currentChapter ? ` → Chapter ${currentChapter.number}: ${currentChapter.name}` : ''}
                {current.topicName ? ` → ${current.topicName}` : ''}
              </p>
            </div>

            <div className="grid gap-3 rounded-xl border border-ink-200 bg-ink-50/60 p-3 sm:p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="label">সময় (মিনিট)</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="720"
                    value={form.durationMinutes}
                    onChange={(event) => setForm((f) => ({ ...f, durationMinutes: event.target.value }))}
                    onFocus={openFinish}
                    placeholder="টাইমার থেকে"
                  />
                  <span className="muted">খালি রাখলে টাইমারের মাপা সময়টাই সেভ হবে</span>
                </label>

                <label className="block">
                  <span className="label">এই সেশনে কতগুলো topic শেষ হলো</span>
                  <input
                    className="input"
                    type="number"
                    min="0"
                    max="20"
                    value={form.topicsCompleted}
                    onChange={(event) => setForm((f) => ({ ...f, topicsCompleted: event.target.value }))}
                  />
                  <span className="muted">topic-এর status কিন্তু নিজে থেকে complete হয় না — ওটা তুমিই ঠিক করবে</span>
                </label>
              </div>

              <div>
                <span className="label">আত্মবিশ্বাস (confidence)</span>
                <div className="flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      type="button"
                      className={`chip ${form.confidence === level ? 'border-brand-300 bg-brand-50 text-brand-700' : 'border-ink-200 bg-white'}`}
                      onClick={() => setForm((f) => ({ ...f, confidence: f.confidence === level ? 0 : level }))}
                    >
                      {level} — {CONFIDENCE_LABELS[level]}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-start gap-2 text-sm text-ink-700">
                <input
                  type="checkbox"
                  className="mt-0.5"
                  checked={form.revisionNeeded}
                  onChange={(event) => setForm((f) => ({ ...f, revisionNeeded: event.target.checked }))}
                />
                <span>
                  এই topic-টা আবার revise করা দরকার
                  <span className="muted block">টিক দিলে topic-টা এখনই Revision Due তালিকায় চলে যাবে</span>
                </span>
              </label>

              <label className="block">
                <span className="label">নোট (ঐচ্ছিক)</span>
                <textarea
                  className="input min-h-20"
                  value={form.note}
                  onChange={(event) => setForm((f) => ({ ...f, note: event.target.value }))}
                  placeholder="আজ কী বুঝলাম, কোথায় আটকে গেলাম..."
                />
              </label>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={finish} disabled={busy}>
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                সেশন শেষ করে সেভ করো
              </Button>
              <Button variant="ghost" onClick={discard} disabled={busy}>
                <Trash2 className="mr-1.5 h-4 w-4" />
                বাদ দাও (সময় যোগ হবে না)
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <CardHeader title="নতুন সেশন শুরু করো" subtitle="Subject → Chapter → Topic বেছে নিয়ে Start চাপো" icon={Play} />
          <div className="space-y-4 p-4 sm:p-5">
            {loading ? (
              <Spinner />
            ) : subjects.length === 0 ? (
              <EmptyState
                title="কোনো subject নেই"
                description="আগে Subject যোগ করো, তারপর এখানে timer চালাতে পারবে।"
                action={<Link className="btn-primary" to="/subjects">Subject যোগ করো</Link>}
              />
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-3">
                  <label className="block">
                    <span className="label">Subject</span>
                    <select className="input" value={subjectId} onChange={(event) => setSubjectId(event.target.value)}>
                      {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Chapter</span>
                    <select className="input" value={chapterId} onChange={(event) => setChapterId(event.target.value)}>
                      {(pickerSubject?.chapters ?? []).map((chapter) => (
                        <option key={chapter.id} value={chapter.id}>
                          Ch {chapter.number}: {chapter.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="label">Topic</span>
                    <select className="input" value={topicId} onChange={(event) => setTopicId(event.target.value)}>
                      {(pickerChapter?.topics ?? []).map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                          {topic.status === 'completed' ? ' ✓' : ''}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <Button onClick={start} disabled={busy}>
                  <Play className="mr-1.5 h-4 w-4" />
                  পড়া শুরু করো
                </Button>
                <p className="muted">
                  Timer চালু হলে সময় আসল ঘড়ি থেকেই মাপা হয় — হাতে বানানো study time কখনো সেভ হয় না।
                </p>
              </>
            )}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader
          title="সাম্প্রতিক সেশন"
          subtitle="প্রতিটা সেশনের আসল সময়, confidence আর নোট"
          icon={RotateCcw}
          action={active.length > 1 ? <Badge>{active.length} টা সেশন খোলা</Badge> : null}
        />
        <div className="divide-y divide-ink-100">
          {recent.length === 0 && (
            <EmptyState
              title="এখনো কোনো সেশন নেই"
              description="প্রথম সেশন শেষ করলেই এখানে সময়, confidence আর নোট দেখা যাবে।"
              icon={PauseCircle}
            />
          )}
          {recent.map((session) => (
            <div key={session.id} className="flex items-start justify-between gap-3 p-4 sm:p-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-ink-900">{session.durationMinutes} মিনিট</span>
                  {session.confidence ? <Badge>confidence {session.confidence}/5</Badge> : null}
                  {session.revisionNeeded ? (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">revision দরকার</Badge>
                  ) : null}
                  {!session.endedAt ? <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">চলছে</Badge> : null}
                </div>
                <p className="muted mt-1 truncate">
                  {session.subjectName ?? 'Subject'}
                  {session.chapterName ? ` → Ch ${session.chapterNumber}: ${session.chapterName}` : ''}
                  {session.topicName ? ` → ${session.topicName}` : ''} · {formatDateShort(session.startedAt)}
                </p>
                {session.note ? <p className="mt-1 text-sm text-ink-700">{session.note}</p> : null}
              </div>
              <button
                type="button"
                className="btn-ghost shrink-0"
                onClick={() => removeSession(session)}
                aria-label="সেশন মুছে ফেলো"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
