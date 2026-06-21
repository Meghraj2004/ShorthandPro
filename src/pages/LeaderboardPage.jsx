// src/pages/LeaderboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { subscribeLeaderboard } from '../firebase/firestore';
import tablerIcons from '../icons/tablerIcons';

const { IconTrophy, IconRefresh, IconMedal } = tablerIcons;

export default function LeaderboardPage() {
  const { currentUser } = useAuth();
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeLeaderboard(data => {
      setBoard(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const rankStyle = rank => {
    if (rank === 1) return { emoji: '🥇', bg: 'bg-amber-50 border-amber-200' };
    if (rank === 2) return { emoji: '🥈', bg: 'bg-gray-50 border-gray-200' };
    if (rank === 3) return { emoji: '🥉', bg: 'bg-orange-50 border-orange-200' };
    return { emoji: `#${rank}`, bg: 'bg-white border-gray-100' };
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <IconTrophy className="text-amber-500" size={26} /> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">Weekly rankings · Updates in real-time</p>
        </div>
        <div className="flex items-center gap-1 text-xs text-green-500 font-semibold bg-green-50 px-3 py-1.5 rounded-full">
          <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : board.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <IconMedal size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">No rankings yet.</p>
          <p className="text-sm mt-1">Complete a practice session to appear here!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {board.map(entry => {
            const { emoji, bg } = rankStyle(entry.rank);
            const isMe = entry.id === currentUser?.uid;
            return (
              <div key={entry.id}
                className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all
                  ${isMe ? 'border-primary-400 bg-primary-50 shadow-md' : bg}`}>
                <div className="text-2xl font-extrabold w-10 text-center">{emoji}</div>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center
                                 text-sm font-bold text-white flex-shrink-0
                                 ${isMe ? 'bg-primary-500' : 'bg-gray-400'}`}>
                  {entry.avatarInitials || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-800 truncate">{entry.name}</span>
                    {isMe && (
                      <span className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-semibold">YOU</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    Total: {entry.totalPoints?.toLocaleString()} pts
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-extrabold text-primary-600">
                    {entry.weeklyPoints?.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400">this week</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-6">
        Points = sessions × accuracy × speed multiplier. Rankings reset every Monday.
      </p>
    </div>
  );
}
