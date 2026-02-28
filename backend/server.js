const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(cors());
app.use(express.json());

// In-memory stores
const quizzes = new Map();
const sessions = new Map(); // roomCode -> session

function getLevel(xp) {
  if (xp >= 2000) return 6;
  if (xp >= 1000) return 5;
  if (xp >= 500) return 4;
  if (xp >= 250) return 3;
  if (xp >= 100) return 2;
  return 1;
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// Seed some sample quizzes
const sampleId = uuidv4();
quizzes.set(sampleId, {
  id: sampleId,
  title: 'General Knowledge',
  description: 'Test your general knowledge!',
  questions: [
    { id: uuidv4(), text: 'What is the capital of France?', options: ['London', 'Berlin', 'Paris', 'Madrid'], correctIndex: 2 },
    { id: uuidv4(), text: 'What is 7 × 8?', options: ['54', '56', '48', '64'], correctIndex: 1 },
    { id: uuidv4(), text: 'Which planet is closest to the Sun?', options: ['Venus', 'Earth', 'Mars', 'Mercury'], correctIndex: 3 },
    { id: uuidv4(), text: 'What is the largest ocean?', options: ['Atlantic', 'Indian', 'Arctic', 'Pacific'], correctIndex: 3 },
    { id: uuidv4(), text: 'Who wrote Romeo and Juliet?', options: ['Dickens', 'Shakespeare', 'Austen', 'Tolkien'], correctIndex: 1 },
  ],
  createdAt: new Date().toISOString()
});

// Quiz CRUD
app.get('/api/quizzes', (req, res) => {
  res.json(Array.from(quizzes.values()));
});

app.post('/api/quizzes', (req, res) => {
  const { title, description, questions } = req.body;
  if (!title || !questions || !Array.isArray(questions)) {
    return res.status(400).json({ error: 'Invalid quiz data' });
  }
  const id = uuidv4();
  const quiz = { id, title, description: description || '', questions: questions.map(q => ({ ...q, id: uuidv4() })), createdAt: new Date().toISOString() };
  quizzes.set(id, quiz);
  res.status(201).json(quiz);
});

app.get('/api/quizzes/:id', (req, res) => {
  const quiz = quizzes.get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  res.json(quiz);
});

app.put('/api/quizzes/:id', (req, res) => {
  const quiz = quizzes.get(req.params.id);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  const updated = { ...quiz, ...req.body, id: quiz.id, createdAt: quiz.createdAt };
  if (req.body.questions) updated.questions = req.body.questions.map(q => ({ ...q, id: q.id || uuidv4() }));
  quizzes.set(quiz.id, updated);
  res.json(updated);
});

app.delete('/api/quizzes/:id', (req, res) => {
  if (!quizzes.has(req.params.id)) return res.status(404).json({ error: 'Quiz not found' });
  quizzes.delete(req.params.id);
  res.json({ success: true });
});

app.post('/api/sessions', (req, res) => {
  const { quizId } = req.body;
  const quiz = quizzes.get(quizId);
  if (!quiz) return res.status(404).json({ error: 'Quiz not found' });
  let roomCode;
  do { roomCode = generateRoomCode(); } while (sessions.has(roomCode));
  const session = {
    id: uuidv4(),
    roomCode,
    quizId,
    quiz,
    status: 'lobby', // lobby | active | ended
    currentQuestionIndex: 0,
    players: {}, // nickname -> { score, streak, answers: [], xp }
    questionStartTime: null,
    answeredCount: 0,
  };
  sessions.set(roomCode, session);
  res.status(201).json({ sessionId: session.id, roomCode });
});

app.get('/api/sessions/:roomCode', (req, res) => {
  const session = sessions.get(req.params.roomCode.toUpperCase());
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({ roomCode: session.roomCode, status: session.status, playerCount: Object.keys(session.players).length, quizTitle: session.quiz.title });
});

// Socket.io
io.on('connection', (socket) => {
  socket.on('host:create', ({ roomCode }) => {
    const session = sessions.get(roomCode);
    if (!session) { socket.emit('error', { message: 'Session not found' }); return; }
    socket.join(roomCode);
    socket.emit('host:joined', { roomCode, quiz: session.quiz, players: Object.keys(session.players) });
  });

  socket.on('student:join', ({ roomCode, nickname }) => {
    roomCode = roomCode.toUpperCase();
    const session = sessions.get(roomCode);
    if (!session) { socket.emit('join:error', { message: 'Room not found' }); return; }
    if (session.status !== 'lobby') { socket.emit('join:error', { message: 'Game already started' }); return; }
    if (session.players[nickname]) { socket.emit('join:error', { message: 'Nickname already taken' }); return; }
    session.players[nickname] = { score: 0, streak: 0, answers: [], xp: 0 };
    socket.join(roomCode);
    socket.data = { roomCode, nickname };
    socket.emit('student:joined', { nickname, roomCode });
    io.to(roomCode).emit('lobby:update', { players: Object.keys(session.players) });
  });

  socket.on('game:start', ({ roomCode }) => {
    const session = sessions.get(roomCode);
    if (!session || session.status !== 'lobby') return;
    session.status = 'active';
    session.currentQuestionIndex = 0;
    session.answeredCount = 0;
    session.questionStartTime = Date.now();
    emitQuestion(roomCode);
  });

  socket.on('game:answer', ({ roomCode, nickname, answerIndex, timeLeft }) => {
    const session = sessions.get(roomCode);
    if (!session || session.status !== 'active') return;
    const player = session.players[nickname];
    if (!player) return;
    const q = session.quiz.questions[session.currentQuestionIndex];
    if (player.answers[session.currentQuestionIndex] !== undefined) {
      socket.emit('answer:result', { alreadyAnswered: true });
      return;
    }
    player.answers[session.currentQuestionIndex] = answerIndex;
    session.answeredCount++;
    const correct = answerIndex === q.correctIndex;
    let points = 0;
    if (correct) {
      const safeTimeLeft = Math.max(0, Math.min(20, timeLeft || 0));
      const timeBonus = Math.floor((safeTimeLeft / 20) * 500);
      player.streak = (player.streak || 0) + 1;
      const streakBonus = Math.min(player.streak * 100, 500);
      points = 1000 + timeBonus + streakBonus;
      player.xp = (player.xp || 0) + 50;
    } else {
      player.streak = 0;
    }
    player.score += points;
    socket.emit('answer:result', { correct, points, streak: player.streak, score: player.score, correctIndex: q.correctIndex });
    io.to(roomCode).emit('game:leaderboard', { leaderboard: getLeaderboard(session) });
  });

  socket.on('game:next', ({ roomCode }) => {
    const session = sessions.get(roomCode);
    if (!session || session.status !== 'active') return;
    session.currentQuestionIndex++;
    session.answeredCount = 0;
    if (session.currentQuestionIndex >= session.quiz.questions.length) {
      session.status = 'ended';
      // Award XP for finishing
      Object.values(session.players).forEach(p => { p.xp = (p.xp || 0) + 100; });
      io.to(roomCode).emit('game:end', { leaderboard: getLeaderboard(session) });
    } else {
      session.questionStartTime = Date.now();
      emitQuestion(roomCode);
    }
  });

  socket.on('disconnect', () => {
    // Clean up player from lobby if game not started
    const { roomCode, nickname } = socket.data || {};
    if (roomCode && nickname) {
      const session = sessions.get(roomCode);
      if (session && session.status === 'lobby') {
        delete session.players[nickname];
        io.to(roomCode).emit('lobby:update', { players: Object.keys(session.players) });
      }
    }
  });
});

function emitQuestion(roomCode) {
  const session = sessions.get(roomCode);
  const q = session.quiz.questions[session.currentQuestionIndex];
  const { correctIndex, ...qWithoutAnswer } = q;
  io.to(roomCode).emit('game:question', {
    question: qWithoutAnswer,
    questionIndex: session.currentQuestionIndex,
    totalQuestions: session.quiz.questions.length,
    timeLimit: 20
  });
}

function getLeaderboard(session) {
  return Object.entries(session.players)
    .map(([nickname, data]) => ({ nickname, score: data.score, streak: data.streak, xp: data.xp }))
    .sort((a, b) => b.score - a.score);
}

httpServer.listen(3001, () => console.log('QuizNova backend running on port 3001'));
