import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Quiz } from '../types';
import QuestionCard from '../components/QuestionCard';

type Phase = 'loading' | 'question' | 'result' | 'finished';

export default function SoloPractice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [phase, setPhase] = useState<Phase>('loading');
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>(undefined);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  useEffect(() => {
    fetch(`/api/quizzes/${id}`).then(r => r.json()).then(data => {
      setQuiz(data);
      setPhase('question');
    });
  }, [id]);

  const answerQuestion = (answerIndex: number) => {
    if (selectedAnswer !== undefined) return;
    setSelectedAnswer(answerIndex);
    const q = quiz!.questions[questionIndex];
    const correct = answerIndex === q.correctIndex;
    if (correct) { setScore(s => s + 1000); setCorrectCount(c => c + 1); }
    setPhase('result');
  };

  const next = () => {
    if (questionIndex + 1 >= quiz!.questions.length) {
      setPhase('finished');
    } else {
      setQuestionIndex(i => i + 1);
      setSelectedAnswer(undefined);
      setPhase('question');
    }
  };

  if (phase === 'loading' || !quiz) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (phase === 'finished') {
    const pct = Math.round((correctCount / quiz.questions.length) * 100);
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center space-y-6">
        <div className="card bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <div className="text-5xl mb-2">{pct >= 80 ? '🏆' : pct >= 60 ? '🎉' : '📖'}</div>
          <h2 className="text-3xl font-extrabold">Practice Complete!</h2>
          <p className="text-xl mt-2">{correctCount}/{quiz.questions.length} correct ({pct}%)</p>
          <p className="text-lg mt-1 font-bold">Score: {score.toLocaleString()}</p>
        </div>
        <div className="flex gap-4">
          <button onClick={() => { setQuestionIndex(0); setSelectedAnswer(undefined); setScore(0); setCorrectCount(0); setPhase('question'); }} className="btn-secondary flex-1">🔄 Try Again</button>
          <button onClick={() => navigate('/dashboard')} className="btn-primary flex-1">Dashboard</button>
        </div>
      </div>
    );
  }

  const q = quiz.questions[questionIndex];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-800">📖 {quiz.title}</h2>
        <span className="text-sm text-gray-500">Q{questionIndex + 1}/{quiz.questions.length}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${((questionIndex) / quiz.questions.length) * 100}%` }} />
      </div>
      <QuestionCard
        question={q}
        selectedAnswer={selectedAnswer}
        correctAnswer={phase === 'result' ? q.correctIndex : undefined}
        onAnswer={answerQuestion}
        disabled={phase === 'result'}
      />
      {phase === 'result' && (
        <div className={`card text-center animate-bounce-in ${selectedAnswer === q.correctIndex ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
          <div className="text-3xl mb-2">{selectedAnswer === q.correctIndex ? '✅ Correct!' : '❌ Wrong!'}</div>
          {selectedAnswer !== q.correctIndex && (
            <p className="text-gray-600 text-sm">Correct answer: <strong>{q.options[q.correctIndex!]}</strong></p>
          )}
          <button onClick={next} className="btn-primary mt-4">
            {questionIndex + 1 < quiz.questions.length ? 'Next Question →' : 'See Results'}
          </button>
        </div>
      )}
    </div>
  );
}
