import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Quiz } from '../types';

export default function Dashboard() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/quizzes').then(r => r.json()).then(data => { setQuizzes(data); setLoading(false); });
  }, []);

  const deleteQuiz = async (id: string) => {
    if (!confirm('Delete this quiz?')) return;
    await fetch(`/api/quizzes/${id}`, { method: 'DELETE' });
    setQuizzes(q => q.filter(x => x.id !== id));
  };

  const hostGame = async (quizId: string) => {
    const res = await fetch('/api/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quizId }) });
    const { roomCode } = await res.json();
    navigate(`/quiz/${quizId}/host?room=${roomCode}`);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800">📚 My Quizzes</h1>
        <Link to="/quiz/create" className="btn-primary text-sm px-6 py-3">+ Create Quiz</Link>
      </div>
      {loading ? (
        <div className="text-center py-20 text-gray-400 text-lg">Loading...</div>
      ) : quizzes.length === 0 ? (
        <div className="card text-center py-20">
          <div className="text-6xl mb-4">📝</div>
          <p className="text-gray-500 text-xl mb-6">No quizzes yet. Create your first one!</p>
          <Link to="/quiz/create" className="btn-primary inline-block">Create Quiz</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map(q => (
            <div key={q.id} className="card hover:shadow-xl transition-shadow flex flex-col gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-1">{q.title}</h2>
                <p className="text-gray-500 text-sm line-clamp-2">{q.description || 'No description'}</p>
                <p className="text-xs text-purple-500 mt-2 font-medium">{q.questions.length} questions</p>
              </div>
              <div className="flex gap-2 mt-auto flex-wrap">
                <button onClick={() => hostGame(q.id)} className="btn-primary text-sm flex-1">🎮 Host</button>
                <Link to={`/quiz/${q.id}/practice`} className="btn-secondary text-sm flex-1 text-center">📖 Practice</Link>
                <Link to={`/quiz/${q.id}/edit`} className="text-gray-400 hover:text-purple-600 p-2 transition-colors">✏️</Link>
                <button onClick={() => deleteQuiz(q.id)} className="text-gray-400 hover:text-red-500 p-2 transition-colors">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
