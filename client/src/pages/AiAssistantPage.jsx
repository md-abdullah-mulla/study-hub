import { useEffect, useMemo, useState } from 'react';
import { Sparkles, Save, Pencil, Trash2, RefreshCw, Copy, Info, NotebookPen, ChevronDown } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { Card, CardHeader, Button, Badge, StatCard, EmptyState, Spinner, ConfirmDialog } from '../components/ui/index.jsx';
import { useAppData } from '../state/AppDataContext.jsx';
import { useToast } from '../state/ToastContext.jsx';

/**
 * AI Assistant screen (Phase 4, second feature).
 *
 * ⚠️ Honesty rule of this screen: there is NO AI API behind it. The content is
 * generated from hand-written Bangla knowledge plus templates inside the app,
 * so every heading says "pattern-based" and the student is told to check the
 * text against their book. Nothing here pretends to be AI output.
 *
 * Flow: pick Subject → Chapter → Topic → Generate → read → edit → save →
 * (optionally) copy it into AI notes, which stay separate from personal notes.
 */
export default function AiAssistantPage() {
  const { subjects } = useAppData();
  const toast = useToast();
  const [searchParams] = useSearchParams();
  // A topic row can link straight here (?topicId=12) so the student does not
  // have to pick the same topic again.
  const requestedTopicId = Number(searchParams.get('topicId')) || null;

  const [kinds, setKinds] = useState([]);
  const [stats, setStats] = useState(null);
  const [saved, setSaved] = useState([]);
  const [generated, setGenerated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [picker, setPicker] = useState({ subjectId: '', chapterId: '', topicId: '' });
  const [drafts, setDrafts] = useState({});
  const [editing, setEditing] = useState(null);
  const [openSection, setOpenSection] = useState(null);
  const [toDelete, setToDelete] = useState(null);

  const load = async () => {
    try {
      const [kindData, statData, listData] = await Promise.all([
        api.studyContent.kinds(),
        api.studyContent.stats(),
        api.studyContent.all(100),
      ]);
      setKinds(kindData.kinds);
      setStats(statData);
      setSaved(listData.contents);
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

  // picker default: the topic that was asked for, otherwise the first topic
  // that is not finished yet
  useEffect(() => {
    if (picker.subjectId || !subjects.length) return;
    if (requestedTopicId) {
      for (const subject of subjects) {
        for (const chapter of subject.chapters) {
          const topic = chapter.topics.find((entry) => entry.id === requestedTopicId);
          if (topic) {
            setPicker({ subjectId: String(subject.id), chapterId: String(chapter.id), topicId: String(topic.id) });
            return;
          }
        }
      }
    }
    for (const subject of subjects) {
      for (const chapter of subject.chapters) {
        const topic = chapter.topics.find((entry) => entry.status !== 'completed');
        if (topic) {
          setPicker({ subjectId: String(subject.id), chapterId: String(chapter.id), topicId: String(topic.id) });
          return;
        }
      }
    }
  }, [subjects, picker.subjectId, requestedTopicId]);

  const pickerSubject = useMemo(
    () => subjects.find((subject) => subject.id === Number(picker.subjectId)) ?? null,
    [subjects, picker.subjectId]
  );
  const pickerChapter = useMemo(
    () => pickerSubject?.chapters.find((chapter) => chapter.id === Number(picker.chapterId)) ?? null,
    [pickerSubject, picker.chapterId]
  );
  const pickerTopic = useMemo(
    () => pickerChapter?.topics.find((topic) => topic.id === Number(picker.topicId)) ?? null,
    [pickerChapter, picker.topicId]
  );

  // keep chapter/topic valid when the subject changes
  useEffect(() => {
    if (!pickerSubject) return;
    if (!pickerSubject.chapters.some((chapter) => chapter.id === Number(picker.chapterId))) {
      const first = pickerSubject.chapters[0];
      setPicker((current) => ({
        ...current,
        chapterId: first ? String(first.id) : '',
        topicId: first?.topics[0] ? String(first.topics[0].id) : '',
      }));
    }
  }, [pickerSubject, picker.chapterId]);

  useEffect(() => {
    if (!pickerChapter) return;
    if (!pickerChapter.topics.some((topic) => topic.id === Number(picker.topicId))) {
      const first = pickerChapter.topics[0];
      setPicker((current) => ({ ...current, topicId: first ? String(first.id) : '' }));
    }
  }, [pickerChapter, picker.topicId]);

  const generate = async () => {
    if (!pickerTopic) return;
    setBusy(true);
    try {
      const data = await api.studyContent.generate(pickerTopic.id);
      setGenerated(data);
      setDrafts(Object.fromEntries(data.sections.map((section) => [section.kind, section.body])));
      setOpenSection(data.sections[0]?.kind ?? null);
      setEditing(null);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  // when arriving from a topic row, generate right away — the student came here
  // to see content for that topic
  useEffect(() => {
    if (!requestedTopicId || generated || busy || !pickerTopic || pickerTopic.id !== requestedTopicId) return;
    generate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedTopicId, pickerTopic, generated, busy]);

  const saveSection = async (section) => {
    setBusy(true);
    try {
      const row = await api.studyContent.save(pickerTopic.id, [
        { kind: section.kind, title: section.title, body: drafts[section.kind], model: generated?.generator },
      ]);
      toast.success(`"${section.label}" save হলো`);
      setSaved((current) => {
        const others = current.filter((entry) => entry.topicId !== pickerTopic.id || entry.kind !== section.kind);
        return [...row.filter((entry) => entry.kind === section.kind), ...others];
      });
      setGenerated((current) => ({
        ...current,
        sections: current.sections.map((entry) =>
          entry.kind === section.kind ? { ...entry, saved: { id: row[0]?.id ?? null }, body: drafts[section.kind] } : entry
        ),
      }));
      setEditing(null);
      setStats(await api.studyContent.stats());
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const saveAll = async () => {
    if (!generated) return;
    setBusy(true);
    try {
      await api.studyContent.save(
        pickerTopic.id,
        generated.sections.map((section) => ({
          kind: section.kind,
          title: section.title,
          body: drafts[section.kind],
          model: generated.generator,
        }))
      );
      toast.success('সব section save হলো');
      await load();
      await generate();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const copySection = async (section) => {
    const text = drafts[section.kind] ?? '';
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else {
        const area = document.createElement('textarea');
        area.value = text;
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      toast.success('Copy হয়েছে');
    } catch {
      toast.error('Copy করা গেল না');
    }
  };

  const removeContent = async () => {
    if (!toDelete) return;
    setBusy(true);
    try {
      await api.studyContent.remove(toDelete.id);
      toast.success('মুছে ফেলা হলো');
      setToDelete(null);
      await load();
      setGenerated((current) =>
        current
          ? {
              ...current,
              sections: current.sections.map((entry) => (entry.kind === toDelete.kind ? { ...entry, saved: null } : entry)),
            }
          : current
      );
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  const toNote = async (contentId) => {
    setBusy(true);
    try {
      await api.studyContent.toNote(contentId);
      toast.success('AI note হিসেবে যোগ হলো (তোমার নিজের note-এর সাথে মেশেনি)');
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          এই feature-এ <strong>কোনো AI API নেই</strong> — কোনো API key লাগে না। লেখাগুলো তোমার নিজের topic data আর
          অ্যাপের ভেতরে রাখা হাতে লেখা তথ্য থেকে তৈরি হয়, তাই যেখানে "draft" লেখা আছে সেখানে নিজে যাচাই করে পূরণ করো।
          {stats?.handwrittenKnowledgeTopics ? ` ${stats.handwrittenKnowledgeTopics}টি concept-এর হাতে লেখা তথ্য আছে।` : ''}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Save করা section" value={stats?.savedSections ?? 0} tone="brand" icon={Save} />
        <StatCard label="Topic" value={stats?.topicsWithContent ?? 0} hint="যেগুলোর content আছে" />
        <StatCard label="Section-এর ধরন" value={kinds.length} hint="সংজ্ঞা থেকে revision summary" />
        <StatCard label="Generator" value="pattern" hint="AI API ছাড়া" />
      </div>

      <Card>
        <CardHeader title="Topic বেছে নিয়ে content তৈরি করো" subtitle="Subject → Chapter → Topic" icon={Sparkles} />
        <div className="space-y-3 p-4 sm:p-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="label">Subject</span>
              <select
                className="input"
                value={picker.subjectId}
                onChange={(event) => setPicker({ subjectId: event.target.value, chapterId: '', topicId: '' })}
              >
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Chapter</span>
              <select
                className="input"
                value={picker.chapterId}
                onChange={(event) => setPicker((current) => ({ ...current, chapterId: event.target.value, topicId: '' }))}
              >
                {(pickerSubject?.chapters ?? []).map((chapter) => (
                  <option key={chapter.id} value={chapter.id}>
                    Ch {chapter.number}: {chapter.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="label">Topic</span>
              <select
                className="input"
                value={picker.topicId}
                onChange={(event) => setPicker((current) => ({ ...current, topicId: event.target.value }))}
              >
                {(pickerChapter?.topics ?? []).map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={generate} disabled={busy || !pickerTopic}>
              <Sparkles className="mr-1.5 h-4 w-4" />
              {busy ? 'তৈরি হচ্ছে...' : 'Content তৈরি করো'}
            </Button>
            {generated && (
              <Button variant="ghost" onClick={generate} disabled={busy}>
                <RefreshCw className="mr-1.5 h-4 w-4" />
                আবার তৈরি করো (Regenerate)
              </Button>
            )}
            {generated && (
              <Button variant="ghost" onClick={saveAll} disabled={busy}>
                <Save className="mr-1.5 h-4 w-4" />
                সব save করো
              </Button>
            )}
          </div>

          {generated && (
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="border-brand-200 bg-brand-50 text-brand-700">
                {generated.topic.name} · {generated.sections.length}টা section
              </Badge>
              <Badge>{generated.generator === 'pattern-draft' ? 'draft (হাতে লেখা তথ্য নেই)' : 'হাতে লেখা তথ্য থেকে'}</Badge>
            </div>
          )}
        </div>
      </Card>

      {generated && (
        <div className="space-y-3">
          {generated.draft && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              এই topic-এর জন্য হাতে লেখা তথ্য নেই, তাই <strong>খালি কাঠামো (draft)</strong> দেওয়া হলো — প্রতিটি অংশ
              তোমার বই দেখে পূরণ করো। এরপর Edit চেপে লিখে Save করলে ওটাই থেকে যাবে।
            </div>
          )}

          {generated.sections.map((section) => {
            const isOpen = openSection === section.kind;
            const isEditing = editing === section.kind;
            return (
              <Card key={section.kind}>
                <button
                  type="button"
                  className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left sm:px-5"
                  onClick={() => setOpenSection(isOpen ? null : section.kind)}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink-900">{section.label}</span>
                      {section.saved ? (
                        <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">save করা আছে</Badge>
                      ) : (
                        <Badge>save করা হয়নি</Badge>
                      )}
                    </div>
                    <p className="muted mt-0.5">{section.title}</p>
                  </div>
                  <ChevronDown className={`h-4 w-4 shrink-0 text-ink-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="space-y-3 border-t border-ink-100 p-4 sm:p-5">
                    {isEditing ? (
                      <textarea
                        className="input min-h-52 resize-y text-sm"
                        value={drafts[section.kind] ?? ''}
                        onChange={(event) => setDrafts((current) => ({ ...current, [section.kind]: event.target.value }))}
                      />
                    ) : (
                      <pre className="max-h-72 overflow-auto whitespace-pre-wrap rounded-xl border border-ink-200 bg-ink-50/60 p-3 text-sm leading-relaxed text-ink-800">
                        {drafts[section.kind]}
                      </pre>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <>
                          <Button onClick={() => saveSection(section)} disabled={busy || !String(drafts[section.kind] ?? '').trim()}>
                            <Save className="mr-1.5 h-4 w-4" />
                            Save
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setDrafts((current) => ({ ...current, [section.kind]: section.body }));
                              setEditing(null);
                            }}
                          >
                            বাতিল
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button variant="ghost" onClick={() => setEditing(section.kind)}>
                            <Pencil className="mr-1.5 h-4 w-4" />
                            Edit
                          </Button>
                          <Button variant="ghost" onClick={() => copySection(section)}>
                            <Copy className="mr-1.5 h-4 w-4" />
                            Copy
                          </Button>
                          {section.saved && (
                            <>
                              <Button variant="ghost" onClick={() => toNote(section.saved.id)} disabled={busy}>
                                <NotebookPen className="mr-1.5 h-4 w-4" />
                                AI note-এ যোগ করো
                              </Button>
                              <Button variant="danger" onClick={() => setToDelete(section)} disabled={busy}>
                                <Trash2 className="mr-1.5 h-4 w-4" />
                                মুছে ফেলো
                              </Button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader title="Save করা content" subtitle="সব topic-এর সংরক্ষিত অংশ — এখান থেকে edit করা যায়" icon={Save} />
        {saved.length === 0 ? (
          <EmptyState
            icon={Sparkles}
            title="এখনো কিছু save করা হয়নি"
            description="উপর থেকে topic বেছে content তৈরি করে Save করলে এখানে জমা থাকবে।"
          />
        ) : (
          <ul className="divide-y divide-ink-100">
            {saved.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 sm:px-5">
                <div className="min-w-0">
                  <p className="truncate text-sm text-ink-800">{row.title ?? row.kind}</p>
                  <p className="muted">
                    {row.subjectName} → Ch {row.chapterNumber} · {row.topicName} · {row.model === 'pattern-draft' ? 'draft' : 'হাতে লেখা তথ্য'}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  <button className="btn-ghost" onClick={() => toNote(row.id)} disabled={busy} aria-label="note-এ যোগ করো">
                    <NotebookPen className="h-4 w-4" />
                  </button>
                  <button className="btn-ghost" onClick={() => setToDelete(row)} disabled={busy} aria-label="মুছে ফেলো">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Content মুছে ফেলবে?"
        message={`"${toDelete?.title ?? toDelete?.kind ?? ''}" মুছে যাবে। নোট হিসেবে যোগ করে থাকলে সেটা থেকেই যাবে।`}
        confirmLabel="মুছে ফেলো"
        busy={busy}
        onClose={() => setToDelete(null)}
        onConfirm={removeContent}
      />
    </div>
  );
}
