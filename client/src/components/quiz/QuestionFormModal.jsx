import { useEffect, useState } from 'react';
import { Modal, Button } from '../ui/index.jsx';
import { QUESTION_TYPES } from '../../lib/quiz.js';

/**
 * Add / edit one quiz question (Phase 3).
 *
 * The form changes with the question type, because the four types ask for
 * different things:
 *  - MCQ         : 2+ options, and the correct one must be picked from them
 *  - True/False  : options are fixed (সত্য / মিথ্যা)
 *  - Short/Viva  : no options; the "model answer" is shown while reviewing,
 *                  and *you* mark your own answer afterwards
 */
const TRUE_FALSE_OPTIONS = ['সত্য', 'মিথ্যা'];
const blank = { type: 'mcq', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', topicId: '' };

export default function QuestionFormModal({ open, onClose, onSubmit, question, topics = [], busy }) {
  const [form, setForm] = useState(blank);

  useEffect(() => {
    if (!open) return;
    if (!question) {
      setForm(blank);
      return;
    }
    setForm({
      type: question.type,
      question: question.question ?? '',
      options: question.options?.length ? [...question.options, '', '', ''].slice(0, Math.max(4, question.options.length)) : ['', '', '', ''],
      correctAnswer: question.correctAnswer ?? '',
      explanation: question.explanation ?? '',
      topicId: question.topicId ?? '',
    });
  }, [open, question]);

  const options = form.type === 'true_false' ? TRUE_FALSE_OPTIONS : form.options;
  const cleanOptions = options.map((option) => option.trim()).filter(Boolean);
  const needsOptions = form.type === 'mcq' || form.type === 'true_false';
  const canSave =
    form.question.trim().length > 0 &&
    (!needsOptions || (cleanOptions.length >= 2 && cleanOptions.includes(form.correctAnswer.trim())));

  const setOption = (index, value) => {
    const next = [...form.options];
    next[index] = value;
    setForm({ ...form, options: next });
  };

  const submit = () => {
    const payload = {
      type: form.type,
      question: form.question.trim(),
      options: needsOptions ? cleanOptions : [],
      correctAnswer: form.correctAnswer.trim() || null,
      explanation: form.explanation.trim() || null,
      topicId: form.topicId ? Number(form.topicId) : null,
    };
    onSubmit(payload);
  };

  return (
    <Modal
      open={open}
      title={question ? 'প্রশ্ন edit' : 'নতুন প্রশ্ন'}
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            বাতিল
          </Button>
          <Button onClick={submit} disabled={busy || !canSave}>
            {question ? 'Save' : 'যোগ করুন'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">প্রশ্নের ধরন</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value, correctAnswer: '' })}>
              {QUESTION_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Topic (কোন topic-এর প্রশ্ন)</label>
            <select className="input" value={form.topicId} onChange={(e) => setForm({ ...form, topicId: e.target.value })}>
              <option value="">— topic ছাড়া —</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
            <p className="muted">topic দিলে দুর্বল topic বের করা যাবে — নাহলে নম্বরটাই শুধু থাকবে।</p>
          </div>
        </div>

        <div>
          <label className="label">প্রশ্ন *</label>
          <textarea
            className="input resize-y"
            rows={2}
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            placeholder="যেমন: MQTT কোন layer-এ কাজ করে?"
          />
        </div>

        {needsOptions ? (
          <div className="space-y-2">
            <label className="label">Option গুলো (সঠিকটা বেছে নাও)</label>
            {options.map((option, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct-option"
                  checked={option.trim() !== '' && form.correctAnswer === option}
                  onChange={() => setForm({ ...form, correctAnswer: option })}
                  aria-label={`সঠিক উত্তর option ${index + 1}`}
                />
                <input
                  className="input"
                  value={option}
                  disabled={form.type === 'true_false'}
                  placeholder={`Option ${index + 1}`}
                  onChange={(e) => {
                    const previous = form.options[index];
                    setOption(index, e.target.value);
                    if (form.correctAnswer === previous) setForm((f) => ({ ...f, correctAnswer: e.target.value }));
                  }}
                />
              </div>
            ))}
            <p className="muted">যে option-টা ঠিক, তার পাশের গোল চিহ্নে ক্লিক করো। খালি option গুলো বাদ যাবে।</p>
          </div>
        ) : (
          <div>
            <label className="label">মডেল উত্তর (নিজে যাচাই করার জন্য)</label>
            <textarea
              className="input resize-y"
              rows={2}
              value={form.correctAnswer}
              onChange={(e) => setForm({ ...form, correctAnswer: e.target.value })}
              placeholder="যা থাকলে উত্তরটা ঠিক বলে ধরবে"
            />
            <p className="muted">
              {form.type === 'viva' ? 'Viva' : 'Short'} প্রশ্ন কম্পিউটার নিজে যাচাই করতে পারে না — তাই উত্তর লেখার পর
              তুমি নিজেই সঠিক/আংশিক/ভুল মার্ক করবে, আর সেই নম্বরই হিসাবে যাবে।
            </p>
          </div>
        )}

        <div>
          <label className="label">Explanation (ঐচ্ছিক)</label>
          <textarea
            className="input resize-y"
            rows={2}
            value={form.explanation}
            onChange={(e) => setForm({ ...form, explanation: e.target.value })}
            placeholder="কেন এটা ঠিক — নিজের ভাষায় লিখে রাখলে revision-এ কাজে দিবে"
          />
        </div>
      </div>
    </Modal>
  );
}
