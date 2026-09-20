import { useState } from 'react';

/**
 * Taking a quiz (Phase 3).
 *
 * Answers are collected locally and submitted in one go. The correct answers
 * only arrive with the response, so nothing on this screen can cheat — the
 * score always reflects what the student actually answered.
 */
const OPTION_LETTERS = ['ক', 'খ', 'গ', 'ঘ', 'ঙ', 'চ'];

export default function QuizRunner({ quiz, onSubmit, busy, onCancel }) {
  const [answers, setAnswers] = useState({});

  const setAnswer = (questionId, value) => setAnswers((current) => ({ ...current, [questionId]: value }));

  const answeredCount = quiz.questions.filter((question) => {
    const value = answers[question.id];
    return value !== undefined && String(value).trim() !== '';
  }).length;

  const submit = () => {
    onSubmit(
      quiz.questions.map((question) => ({
        questionId: question.id,
        answer: answers[question.id] ?? '',
      }))
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="muted">
          {quiz.questions.length} টা প্রশ্ন · উত্তর দিয়েছ {answeredCount} টা
        </p>
        <p className="muted">MCQ/True-False নিজে থেকে যাচাই হবে; Short/Viva জমা দেওয়ার পরে তুমি নিজে মার্ক দিবে।</p>
      </div>

      {quiz.questions.map((question, index) => (
        <div key={question.id} className="rounded-2xl border border-ink-200 bg-white p-3.5 shadow-card sm:p-4">
          <div className="flex items-start gap-2">
            <span className="mt-0.5 rounded-lg bg-brand-50 px-2 py-0.5 text-xs font-semibold text-brand-700">
              {index + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink-900">{question.question}</p>
              <p className="muted mt-0.5">
                {question.typeLabel}
                {question.topicName ? ` · ${question.topicName}` : ''}
              </p>

              {(question.type === 'mcq' || question.type === 'true_false') && (
                <div className="mt-2 space-y-1.5">
                  {question.options.map((option, optionIndex) => {
                    const checked = answers[question.id] === option;
                    return (
                      <label
                        key={option}
                        className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 text-sm ${
                          checked ? 'border-brand-300 bg-brand-50 text-brand-800' : 'border-ink-200 bg-white text-ink-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${question.id}`}
                          checked={checked}
                          onChange={() => setAnswer(question.id, option)}
                        />
                        <span className="font-medium text-ink-500">{OPTION_LETTERS[optionIndex]}.</span>
                        <span>{option}</span>
                      </label>
                    );
                  })}
                </div>
              )}

              {(question.type === 'short' || question.type === 'viva') && (
                <textarea
                  className="input mt-2 resize-y"
                  rows={3}
                  value={answers[question.id] ?? ''}
                  onChange={(event) => setAnswer(question.id, event.target.value)}
                  placeholder={question.type === 'viva' ? 'মুখে যা বলতে — সেটা এখানে লিখে রাখো' : 'সংক্ষেপে উত্তর লেখো'}
                />
              )}
            </div>
          </div>
        </div>
      ))}

      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={submit} disabled={busy}>
          জমা দাও ও স্কোর দেখো
        </button>
        <button className="btn-ghost" onClick={onCancel} disabled={busy}>
          বাতিল
        </button>
      </div>
    </div>
  );
}
