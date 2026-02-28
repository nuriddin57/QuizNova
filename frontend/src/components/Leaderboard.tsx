import type { LeaderboardEntry } from '../types';
import { getLevel } from '../types';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentPlayer?: string;
}

const MEDALS = ['🥇', '🥈', '🥉'];

export default function Leaderboard({ entries, currentPlayer }: LeaderboardProps) {
  return (
    <div className="card">
      <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">🏆 Leaderboard</h3>
      <div className="space-y-2">
        {entries.slice(0, 10).map((entry, i) => {
          const lvl = getLevel(entry.xp);
          const isMe = entry.nickname === currentPlayer;
          return (
            <div key={entry.nickname} className={`flex items-center gap-3 p-2 rounded-lg transition-all ${isMe ? 'bg-purple-100 border-2 border-purple-400' : 'bg-gray-50'}`}>
              <span className="text-xl w-8 text-center">{MEDALS[i] || `${i + 1}`}</span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{entry.nickname} {isMe && '(you)'}</div>
                <div className="text-xs text-gray-500">Lv.{lvl.level} {lvl.label} · {entry.xp} XP</div>
              </div>
              <div className="text-right">
                <div className="font-black text-purple-700">{entry.score.toLocaleString()}</div>
                {entry.streak > 1 && <div className="text-xs text-orange-500">🔥 x{entry.streak}</div>}
              </div>
            </div>
          );
        })}
        {entries.length === 0 && <p className="text-gray-400 text-center text-sm py-4">No players yet</p>}
      </div>
    </div>
  );
}
