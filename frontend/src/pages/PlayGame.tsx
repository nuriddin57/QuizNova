import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import socket from '../socket';
import QuestionCard from '../components/QuestionCard';
import Leaderboard from '../components/Leaderboard';
import Timer from '../components/Timer';
import type { LeaderboardEntry } from '../types';
import { getLevel } from '../types';

type Phase = 'lobby' | 'question' | 'result' | 'leaderboard' | 'ended';

interface QuestionData {
  id: string;
  text: string;
  options: string[];
}

interface AnswerResult {
  correct: boolean;
  points: number;
  streak: number;
  score: number;
  correctIndex: number;
}

export default function PlayGame() {
  const location = useLocation();
  const navigate = useNavigate();
  const { roomCode, nickname } = (location.state || {}) as { roomCode: string; nickname: string };

  const [phase, setPhase] = useState<Phase>('lobby');
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | undefined>(undefined);
  const [timeLeft, setTimeLeft] = useState(20);
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    if (!roomCode || !nickname) { navigate('/join'); return; }

    socket.on('game:question', (data: { question: QuestionData; questionIndex: number; totalQuestions: number }) => {
      setCurrentQuestion(data.question);
      setQuestionIndex(data.questionIndex);
      setTotalQuestions(data.totalQuestions);
      setSelectedAnswer(undefined);
      setAnswerResult(null);
      setTimeLeft(20);
      setPhase('question');
    });

    socket.on('answer:result', (data: AnswerResult) => {
      setAnswerResult(data);
      setPhase('result');
    });

    socket.on('game:leaderboard', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
    });

    socket.on('game:end', (data: { leaderboard: LeaderboardEntry[] }) => {
      setLeaderboard(data.leaderboard);
      setPhase('ended');
    });

    return () => {
      socket.off('game:question');
      socket.off('answer:result');
      socket.off('game:leaderboard');
      socket.off('game:end');
    };
  }, [roomCode, nickname]);

  const submitAnswer = (answerIndex: number) => {
    if (selectedAnswer !== undefined) return;
    setSelectedAnswer(answerIndex);
    socket.emit('game:answer', { roomCode, nickname, answerIndex, timeLeft });
  };

  const myEntry = leaderboard.find(e => e.nickname === nickname);

  if (phase === 'lobby') {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="card text-center max-w-md">
          <div className="text-6xl mb-4 animate-bounce">🎮</div>
          <h2 className="text-2xl font-extrabold text-gray-800 mb-2">You're in! 🎉</h2>
          <p className="text-gray-600 mb-4">Playing as <span className="font-bold text-purple-600">{nickname}</span></p>
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
            <p className="text-purple-700 font-medium">Waiting for the host to start the game...</p>
            <div className="mt-3 flex gap-1 justify-center">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.2}s` }} />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'ended') {
    const myPos = leaderboard.findIndex(e => e.nickname === nickname) + 1;
    const lvl = getLevel(myEntry?.xp || 0);
    return (
      <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
        <div className="card bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center">
          <div className="text-5xl mb-2">🏆</div>
          <h2 className="text-3xl font-extrabold">Game Over!</h2>
          <p className="text-xl mt-2">You finished #{myPos}</p>
          {myEntry && (
            <div className="mt-4 bg-white/20 rounded-xl p-4">
              <p className="text-2xl font-extrabold">{myEntry.score.toLocaleString()} pts</p>
              <p className="text-sm mt-1">Lv.{lvl.level} {lvl.label} · {myEntry.xp} XP</p>
            </div>
          )}
        </div>
        <Leaderboard entries={leaderboard} currentPlayer={nickname} />
        <button onClick={() => navigate('/')} className="btn-primary w-full py-3">Back to Home</button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          <span className="font-bold text-purple-700">{nickname}</span>
          {myEntry && <span className="ml-2 text-gray-400">· {myEntry.score.toLocaleString()} pts</span>}
        </div>
        <span className="text-sm text-gray-500">Q{questionIndex + 1}/{totalQuestions}</span>
      </div>

      {/* Timer */}
      {phase === 'question' && (
        <div className="card p-4">
          <Timer duration={20} onExpire={() => setPhase('result')} onTick={setTimeLeft} />
        </div>
      )}

      {/* Question */}
      {currentQuestion && (
        <QuestionCard
          question={currentQuestion}
          selectedAnswer={selectedAnswer}
          correctAnswer={answerResult?.correctIndex}
          onAnswer={submitAnswer}
          disabled={phase !== 'question' || selectedAnswer !== undefined}
        />
      )}

      {/* Result */}
      {phase === 'result' && answerResult && (
        <div className={`card text-center animate-bounce-in ${answerResult.correct ? 'bg-green-50 border-2 border-green-400' : 'bg-red-50 border-2 border-red-400'}`}>
          <div className="text-4xl mb-2">{answerResult.correct ? '✅' : '❌'}</div>
          <p className={`text-xl font-extrabold ${answerResult.correct ? 'text-green-700' : 'text-red-700'}`}>
            {answerResult.correct ? 'Correct!' : 'Wrong!'}
          </p>
          {answerResult.correct && (
            <div className="mt-2 space-y-1">
              <p className="text-green-600 font-bold">+{answerResult.points} pts</p>
              {answerResult.streak > 1 && <p className="text-orange-500 text-sm">🔥 {answerResult.streak}x streak!</p>}
            </div>
          )}
          <p className="text-gray-500 text-sm mt-2">Waiting for next question...</p>
        </div>
      )}

      {/* Live leaderboard mini */}
      {leaderboard.length > 0 && (
        <Leaderboard entries={leaderboard} currentPlayer={nickname} />
      )}
    </div>
  );
}
