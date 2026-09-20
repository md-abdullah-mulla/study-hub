import { useEffect, useState } from 'react';
import { Modal, Button } from '../ui/index.jsx';
import { IMPORTANCE_LABEL } from '../../lib/status.js';

/**
 * Small add/edit dialogs for Subject, Chapter and Topic.
 * Each one is used by more than one page, so they live together here.
 */

const SUBJECT_COLORS = ['#2563eb', '#0891b2', '#7c3aed', '#ea580c', '#059669', '#db2777', '#ca8a04', '#4f46e5'];

export function SubjectFormModal({ open, onClose, onSubmit, subject, busy }) {
  const [form, setForm] = useState({ name: '', nameBn: '', code: '', color: SUBJECT_COLORS[0] });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: subject?.name ?? '',
      nameBn: subject?.nameBn ?? '',
      code: subject?.code ?? '',
      color: subject?.color ?? SUBJECT_COLORS[0],
    });
  }, [open, subject]);

  return (
    <Modal
      open={open}
      title={subject ? 'Subject edit' : 'নতুন Subject'}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>
            {subject ? 'Save' : 'যোগ করুন'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Subject name *</label>
          <input
            className="input"
            autoFocus
            placeholder="যেমন: Operating System"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">বাংলা নাম (ঐচ্ছিক)</label>
            <input className="input" value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
          </div>
          <div>
            <label className="label">Subject code (ঐচ্ছিক)</label>
            <input className="input" placeholder="28561" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          </div>
        </div>
        <div>
          <label className="label">রঙ</label>
          <div className="flex flex-wrap gap-2">
            {SUBJECT_COLORS.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setForm({ ...form, color })}
                aria-label={`color ${color}`}
                className={`h-7 w-7 rounded-full border-2 ${form.color === color ? 'border-ink-900' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ChapterFormModal({ open, onClose, onSubmit, chapter, subjectName, busy }) {
  const [form, setForm] = useState({ name: '', nameBn: '', number: '' });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: chapter?.name ?? '',
      nameBn: chapter?.nameBn ?? '',
      number: chapter?.number ?? '',
    });
  }, [open, chapter]);

  return (
    <Modal
      open={open}
      title={chapter ? 'Chapter edit' : `নতুন Chapter${subjectName ? ` — ${subjectName}` : ''}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>
            {chapter ? 'Save' : 'যোগ করুন'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-[110px,1fr]">
          <div>
            <label className="label">Chapter no.</label>
            <input
              className="input"
              type="number"
              min="1"
              placeholder="1"
              value={form.number}
              onChange={(e) => setForm({ ...form, number: e.target.value })}
            />
          </div>
          <div>
            <label className="label">Chapter name *</label>
            <input
              className="input"
              autoFocus
              placeholder="যেমন: Introduction to IoT"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="label">বাংলা নাম (ঐচ্ছিক)</label>
          <input className="input" value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
        </div>
        <p className="muted">Chapter number ফাঁকা রাখলে পরের নম্বর automatic বসবে।</p>
      </div>
    </Modal>
  );
}

export function TopicFormModal({ open, onClose, onSubmit, topic, chapterName, busy }) {
  const [form, setForm] = useState({ name: '', nameBn: '', description: '', importance: 'medium' });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: topic?.name ?? '',
      nameBn: topic?.nameBn ?? '',
      description: topic?.description ?? '',
      importance: topic?.importance ?? 'medium',
    });
  }, [open, topic]);

  return (
    <Modal
      open={open}
      title={topic ? 'Topic edit' : `নতুন Topic${chapterName ? ` — ${chapterName}` : ''}`}
      onClose={onClose}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button onClick={() => onSubmit(form)} disabled={busy || !form.name.trim()}>
            {topic ? 'Save' : 'যোগ করুন'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <label className="label">Topic name *</label>
          <input
            className="input"
            autoFocus
            placeholder="যেমন: MQTT"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">বাংলা নাম (ঐচ্ছিক)</label>
          <input className="input" value={form.nameBn} onChange={(e) => setForm({ ...form, nameBn: e.target.value })} />
        </div>
        <div>
          <label className="label">Description (ঐচ্ছিক)</label>
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
  );
}

export { SUBJECT_COLORS };
