import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import socket from '../socket';
import Leaderboard from '../components/Leaderboard';
import Timer from '../components/Timer';
import type { LeaderboardEntry } from '../types';

type Phase = 'lobby' | 'question' | 'leaderboard' | 'ended';

interface CurrentQuestion {
  id: string;
  text: string;
  options: string[];
}

export default function HostGame() {
  const { id: quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const roomCode = searchParams.get('room') || '';

  const [phase, setPhase] = useState<Phase>('lobby');
  const [players, setPlayers] = useState<string[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<CurrentQuestion | null>(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(20);

  useEffect(() => {
    if (!roomCode) { navigate('/dashboard'); return; }
    socket.connect();
    socket.emit('host:create', { roomCode });

    socket.on('host:joined', (data: { quiz: { questions: unknown[] } }) => {
      setTotalQuestions(data.quiz.questions.length);
    });
    socket.on('lobby:update', (data: { players: string[] }) => setPlayers(data.players));
    socket.on('game:question', (data: { question: CurrentQuestion; questionIndex: number; totalQuestions: number }) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setPhase('question');
      setTimeLeft(20);
    });
    socket.on('game:leaderboard', (data: { leaderboard: LeaderboardEntry[] }) => setLeaderboard(data.leaderboard));
    socket.on('game:end', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setPhase('ended');
    });

    return () => { socket.off('host:joined'); socket.off('lobby:update'); socket.off('game:question'); socket.off('game:leaderboard'); socket.off('game:end'); socket.disconnect(); };
  }, [roomCode]);

  const startGame = () => socket.emit('game:start', { roomCode });
  const nextQuestion = () => {
    setPhase('leaderboard');
    socket.emit('game:next', { roomCode });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Room code always visible */}
      <div className="card mb-6 text-center bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <p className="text-sm font-medium opacity-80 mb-1">ROOM CODE</p>
        <div className="flex items-center justify-center gap-4">
          <span className="text-6xl font-extrabold tracking-widest">{roomCode}</span>
          <button onClick={copyCode} className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-medium transition-all">
            {copied ? '✓ Copied!' : '📋 Copy'}
          </button>
        </div>
        <p className="text-sm opacity-70 mt-2">Students go to <strong>quiznova.app</strong> and enter this code</p>
      </div>

      {phase === 'lobby' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card">
            <h2 className="text-xl font-bold mb-4">👥 Players ({players.length})</h2>
            {players.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Waiting for students to join...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {players.map(p => (
                  <div key={p} className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 text-sm font-medium text-purple-700">
                    🎮 {p}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="card flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold mb-2">Game Settings</h2>
              <p className="text-gray-500 text-sm">20 seconds per question</p>
              <p className="text-gray-500 text-sm">Base score: 1000 pts + time bonus</p>
              <p className="text-gray-500 text-sm">Streak bonuses awarded</p>
            </div>
            <button onClick={startGame} disabled={players.length < 1} className="btn-primary w-full mt-6 py-4 text-lg">
              {players.length < 1 ? 'Waiting for players...' : `🚀 Start Game (${players.length} player${players.length > 1 ? 's' : ''})`}
            </button>
          </div>
        </div>
      )}

      {phase === 'question' && currentQuestion && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-600 font-medium">Question {questionIndex + 1} of {totalQuestions}</span>
            <div className="w-48">
              <Timer duration={20} onExpire={() => setPhase('leaderboard')} onTick={setTimeLeft} />
            </div>
          </div>
          <div className="card text-center text-2xl font-bold text-gray-800 py-8">
            {currentQuestion.text}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {currentQuestion.options.map((opt, i) => {
              const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500'];
              const labels = ['A', 'B', 'C', 'D'];
              return (
                <div key={i} className={`${colors[i]} text-white font-bold rounded-xl p-4 flex items-center gap-3`}>
                  <span className="bg-white/20 rounded-lg w-10 h-10 flex items-center justify-center text-xl font-black">{labels[i]}</span>
                  {opt}
                </div>
              );
            })}
          </div>
          <button onClick={nextQuestion} className="btn-secondary w-full">
            {questionIndex + 1 < totalQuestions ? '⏭ Next Question' : '🏁 End Game'}
          </button>
        </div>
      )}

      {phase === 'leaderboard' && (
        <div className="space-y-4">
          <Leaderboard entries={leaderboard} />
          <button onClick={() => socket.emit('game:next', { roomCode })} className="btn-primary w-full py-3">
            {questionIndex + 1 < totalQuestions ? '⏭ Next Question' : '🏁 End Game'}
          </button>
        </div>
      )}

      {phase === 'ended' && (
        <div className="space-y-6 text-center">
          <div className="card bg-gradient-to-r from-yellow-400 to-orange-400 text-white">
            <div className="text-5xl mb-2">🏆</div>
            <h2 className="text-3xl font-extrabold">Game Over!</h2>
            {leaderboard[0] && <p className="text-xl mt-2">🥇 Winner: <strong>{leaderboard[0].nickname}</strong> with {leaderboard[0].score.toLocaleString()} pts</p>}
          </div>
          <Leaderboard entries={leaderboard} />
          <button onClick={() => navigate('/dashboard')} className="btn-primary w-full py-3">Back to Dashboard</button>
        </div>
      )}
    </div>
  );
}
