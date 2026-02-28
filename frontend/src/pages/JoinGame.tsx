import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import socket from '../socket';

export default function JoinGame() {
  const [roomCode, setRoomCode] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(false);
  const navigate = useNavigate();

  const join = () => {
    setError('');
    if (!roomCode.trim() || roomCode.length < 6) { setError('Enter a valid 6-character room code'); return; }
    if (!nickname.trim() || nickname.length < 2) { setError('Nickname must be at least 2 characters'); return; }
    setJoining(true);
    socket.connect();
    socket.emit('student:join', { roomCode: roomCode.toUpperCase(), nickname: nickname.trim() });
    socket.once('student:joined', () => {
      navigate('/play', { state: { roomCode: roomCode.toUpperCase(), nickname: nickname.trim() } });
    });
    socket.once('join:error', (data: { message: string }) => {
      setError(data.message);
      setJoining(false);
      socket.disconnect();
    });
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-4">
      <div className="card w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🎮</div>
          <h1 className="text-3xl font-extrabold text-gray-800">Join a Game</h1>
          <p className="text-gray-500 mt-2">Enter the room code from your teacher</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Room Code</label>
            <input
              className="input-field text-center text-2xl font-bold uppercase tracking-widest"
              placeholder="ABCDEF"
              maxLength={6}
              value={roomCode}
              onChange={e => setRoomCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && join()}
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Nickname</label>
            <input
              className="input-field"
              placeholder="Your cool nickname"
              maxLength={20}
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && join()}
            />
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
          <button onClick={join} disabled={joining} className="btn-primary w-full py-4 text-lg">
            {joining ? 'Joining...' : '🚀 Join Game'}
          </button>
        </div>
      </div>
    </div>
  );
}
