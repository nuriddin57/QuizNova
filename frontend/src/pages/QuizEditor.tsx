import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Question } from '../types';

interface QuizForm {
  title: string;
  description: string;
  questions: Question[];
}

const emptyQuestion = (): Question => ({ id: '', text: '', options: ['', '', '', ''], correctIndex: 0 });

export default function QuizEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<QuizForm>({ title: '', description: '', questions: [emptyQuestion()] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      fetch(`/api/quizzes/${id}`).then(r => r.json()).then(data => {
        setForm({ title: data.title, description: data.description, questions: data.questions });
      });
    }
  }, [id]);

  const addQuestion = () => setForm(f => ({ ...f, questions: [...f.questions, emptyQuestion()] }));
  const removeQuestion = (i: number) => setForm(f => ({ ...f, questions: f.questions.filter((_, idx) => idx !== i) }));

  const updateQuestion = (i: number, key: keyof Question, val: string | number | string[]) => {
    setForm(f => {
      const qs = [...f.questions];
      qs[i] = { ...qs[i], [key]: val };
      return { ...f, questions: qs };
    });
  };

  const updateOption = (qi: number, oi: number, val: string) => {
    setForm(f => {
      const qs = [...f.questions];
      const opts = [...qs[qi].options];
      opts[oi] = val;
      qs[qi] = { ...qs[qi], options: opts };
      return { ...f, questions: qs };
    });
  };

  const save = async () => {
    setError('');
    if (!form.title.trim()) { setError('Quiz title is required'); return; }
    if (form.questions.some(q => !q.text.trim() || q.options.some(o => !o.trim()))) {
      setError('All questions and options must be filled in'); return;
    }
    setSaving(true);
    const method = id ? 'PUT' : 'POST';
    const url = id ? `/api/quizzes/${id}` : '/api/quizzes';
    const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    if (res.ok) { navigate('/dashboard'); } else { setError('Failed to save quiz'); setSaving(false); }
  };

  const LABELS = ['A', 'B', 'C', 'D'];
  const OPT_COLORS = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-gray-800 mb-8">{id ? '✏️ Edit Quiz' : '✨ Create Quiz'}</h1>
      <div className="card mb-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Quiz Title *</label>
            <input className="input-field" placeholder="e.g. Solar System Quiz" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Description</label>
            <textarea className="input-field" rows={2} placeholder="Brief description of this quiz" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
        </div>
      </div>

      {form.questions.map((q, qi) => (
        <div key={qi} className="card mb-4 border-l-4 border-purple-400">
          <div className="flex items-center justify-between mb-3">
            <span className="font-bold text-purple-700 text-sm">Question {qi + 1}</span>
            {form.questions.length > 1 && (
              <button onClick={() => removeQuestion(qi)} className="text-red-400 hover:text-red-600 text-sm">Remove</button>
            )}
          </div>
          <input className="input-field mb-4" placeholder="Question text" value={q.text} onChange={e => updateQuestion(qi, 'text', e.target.value)} />
          <div className="grid grid-cols-2 gap-2 mb-3">
            {q.options.map((opt, oi) => (
              <div key={oi} className={`flex items-center gap-2 border-2 rounded-lg p-2 transition-all ${q.correctIndex === oi ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
                <span className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-sm flex-shrink-0 ${OPT_COLORS[oi]}`}>{LABELS[oi]}</span>
                <input className="flex-1 outline-none text-sm bg-transparent" placeholder={`Option ${LABELS[oi]}`} value={opt} onChange={e => updateOption(qi, oi, e.target.value)} />
                <button onClick={() => updateQuestion(qi, 'correctIndex', oi)} title="Mark as correct" className={`text-lg ${q.correctIndex === oi ? 'text-green-600' : 'text-gray-300 hover:text-green-400'}`}>✓</button>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400">Click ✓ next to the correct answer</p>
        </div>
      ))}

      <button onClick={addQuestion} className="btn-secondary w-full mb-6">+ Add Question</button>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">{error}</div>}

      <div className="flex gap-4">
        <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
        <button onClick={save} disabled={saving} className="btn-primary flex-1">{saving ? 'Saving...' : '💾 Save Quiz'}</button>
      </div>
    </div>
  );
}
