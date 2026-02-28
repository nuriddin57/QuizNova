export interface Question {
  id: string;
  text: string;
  options: string[];
  correctIndex?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

export interface Player {
  nickname: string;
  score: number;
  streak: number;
  xp: number;
}

export interface GameSession {
  sessionId: string;
  roomCode: string;
  quizTitle: string;
  status: 'lobby' | 'active' | 'ended';
}

export interface LeaderboardEntry {
  nickname: string;
  score: number;
  streak: number;
  xp: number;
}

export const XP_LEVELS = [
  { level: 1, minXP: 0, label: 'Novice' },
  { level: 2, minXP: 100, label: 'Learner' },
  { level: 3, minXP: 250, label: 'Scholar' },
  { level: 4, minXP: 500, label: 'Expert' },
  { level: 5, minXP: 1000, label: 'Master' },
  { level: 6, minXP: 2000, label: 'Legend' },
];

export function getLevel(xp: number): { level: number; label: string } {
  for (let i = XP_LEVELS.length - 1; i >= 0; i--) {
    if (xp >= XP_LEVELS[i].minXP) return XP_LEVELS[i];
  }
  return XP_LEVELS[0];
}
