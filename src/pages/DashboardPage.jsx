// src/pages/DashboardPage.jsx
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserSessions } from '../lib/database';
import { format, subDays, isSameDay } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';
import tablerIcons from '../icons/tablerIcons';

const {
  IconHeadphones, IconTarget, IconBolt, IconFlame,
  IconTrophy, IconChartLine, IconCalendar, IconLanguage,
} = tablerIcons;

const SPEED_LEVELS = [60, 80, 100, 120, 140, 160];

function StatCard({ icon: Icon, label, value, sub, color = 'purple' }) {
  const colors = {
    purple: 'bg-violet-100 text-violet-600',
    green:  'bg-green-100  text-green-600',
    blue:   'bg-blue-100   text-blue-600',
    amber:  'bg-amber-100  text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4 shadow-sm">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
        <Icon size={22} />
      </div>
      <div>
        <div className="text-2xl font-extrabold text-gray-900 leading-tight">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
        {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
      </div>
    </div>
  );
}

function SpeedProgressBar({ wpm, sessions, unlocked }) {
  const wpmSessions = sessions.filter(s => s.wpm === wpm);
  const goodSessions = wpmSessions.filter(s => s.accuracy >= 80).length;
  const avgAcc = wpmSessions.length
    ? Math.round(wpmSessions.reduce((a, s) => a + s.accuracy, 0) / wpmSessions.length)
    : 0;
  const progress = Math.min(100, Math.round((goodSessions / 3) * 100));
  const completed = goodSessions >= 3;

  return (
    <div className="flex items-center gap-3 mb-3">
      <div className="w-20 text-sm font-bold text-gray-700">{wpm} WPM</div>
      <div className="flex-1">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>{wpmSessions.length} sessions</span>
          <span>{avgAcc ? `${avgAcc}% avg` : '—'}</span>
        </div>
        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700
              ${completed ? 'bg-green-500' : unlocked ? 'bg-primary-500' : 'bg-gray-300'}`}
            style={{ width: `${unlocked ? progress : 0}%` }}
          />
        </div>
      </div>
      <div className="w-10 text-right">
        {completed
          ? <span className="text-green-500 font-bold text-sm">✓</span>
          : <span className="text-xs text-gray-400">{unlocked ? `${progress}%` : '🔒'}</span>
        }
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { currentUser, userProfile } = useAuth();
  const [sessions, setSessions]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tab, setTab]             = useState('overview');

  useEffect(() => {
    async function load() {
      if (!currentUser?.uid) {
        setLoading(false);
        return;
      }
      try {
        const s = await getUserSessions(currentUser.uid, 100);
        setSessions(s);
      } catch { /* silent */ }
      finally { setLoading(false); }
    }
    load();
  }, [currentUser?.uid]);

  // ── Stats ──────────────────────────────────────────────────────
  const totalSessions = sessions.length;
  const avgAccuracy   = totalSessions
    ? Math.round(sessions.reduce((a, s) => a + s.accuracy, 0) / totalSessions)
    : 0;
  const bestWpm       = sessions.length
    ? Math.max(...sessions.map(s => s.effectiveWpm || 0))
    : 0;
  const enSessions    = sessions.filter(s => s.language === 'en');
  const mrSessions    = sessions.filter(s => s.language === 'mr');

  // ── Last 7 days chart ─────────────────────────────────────────
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const date     = subDays(new Date(), 6 - i);
    const dayS     = sessions.filter(s => s.createdAt?.toDate && isSameDay(s.createdAt.toDate(), date));
    const acc      = dayS.length ? Math.round(dayS.reduce((a, s) => a + s.accuracy, 0) / dayS.length) : null;
    return { day: format(date, 'EEE'), accuracy: acc, sessions: dayS.length };
  });

  // ── Speed breakdown for bar chart ────────────────────────────
  const speedData = SPEED_LEVELS.map(wpm => {
    const wpmS = sessions.filter(s => s.wpm === wpm);
    const avg  = wpmS.length ? Math.round(wpmS.reduce((a, s) => a + s.accuracy, 0) / wpmS.length) : 0;
    return { wpm: `${wpm}`, sessions: wpmS.length, avgAccuracy: avg };
  }).filter(d => d.sessions > 0);

  // ── Recent sessions ───────────────────────────────────────────
  const recent = sessions.slice(0, 15);

  const unlockedSpeeds = userProfile?.unlockedSpeeds || [60];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading your progress…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back, <strong>{userProfile?.name?.split(' ')[0]}</strong>! Here's your practice overview.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={IconHeadphones} label="Total Sessions"  value={totalSessions}     color="purple" />
        <StatCard icon={IconTarget}     label="Avg. Accuracy"   value={`${avgAccuracy}%`} color="green"  />
        <StatCard icon={IconBolt}       label="Best Eff. WPM"   value={bestWpm || '—'}    color="blue"   />
        <StatCard icon={IconFlame}      label="Day Streak"       value={userProfile?.streak || 0} sub="days" color="amber" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit mb-6">
        {['overview', 'history', 'progress'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-all
              ${tab===t ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Accuracy trend */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <IconChartLine size={18} className="text-primary-500" />
              <h3 className="font-bold text-gray-800">Accuracy Trend — Last 7 Days</h3>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={last7} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#9ca3af' }} />
                <Tooltip
                  contentStyle={{ borderRadius: 10, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', fontSize: 13 }}
                  formatter={(v) => v != null ? [`${v}%`, 'Accuracy'] : ['No data', '']}
                />
                <Line
                  type="monotone" dataKey="accuracy" stroke="#6c63ff"
                  strokeWidth={2.5} dot={{ r: 5, fill: '#6c63ff', strokeWidth: 2, stroke: '#fff' }}
                  connectNulls activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Speed breakdown + Language split */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <IconBolt size={18} className="text-primary-500" />
                <h3 className="font-bold text-gray-800">Sessions by Speed</h3>
              </div>
              {speedData.length === 0
                ? <p className="text-sm text-gray-400">No sessions yet. Start practising!</p>
                : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={speedData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="wpm" tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#9ca3af' }} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: 'none', fontSize: 13 }} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="sessions" fill="#6c63ff" radius={[4,4,0,0]} name="Sessions" />
                      <Bar dataKey="avgAccuracy" fill="#ff6584" radius={[4,4,0,0]} name="Avg Acc %" />
                    </BarChart>
                  </ResponsiveContainer>
                )
              }
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <IconLanguage size={18} className="text-primary-500" />
                <h3 className="font-bold text-gray-800">Language Breakdown</h3>
              </div>
              <div className="space-y-4">
                {[
                  { label: '🇬🇧 English', sessions: enSessions, color: 'bg-primary-500' },
                  { label: '🇮🇳 Marathi', sessions: mrSessions, color: 'bg-pink-500' },
                ].map(({ label, sessions: s, color }) => {
                  const avg = s.length ? Math.round(s.reduce((a,x)=>a+x.accuracy,0)/s.length) : 0;
                  const pct = totalSessions ? Math.round((s.length/totalSessions)*100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="font-semibold text-gray-700">{label}</span>
                        <span className="text-gray-400">{s.length} sessions · {avg}% avg</span>
                      </div>
                      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-gray-100 grid grid-cols-2 gap-3 text-center">
                  <div>
                    <div className="text-xl font-extrabold text-primary-600">{enSessions.length}</div>
                    <div className="text-xs text-gray-400">English</div>
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-pink-500">{mrSessions.length}</div>
                    <div className="text-xs text-gray-400">Marathi</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── HISTORY TAB ──────────────────────────────────────── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center gap-2">
            <IconCalendar size={18} className="text-primary-500" />
            <h3 className="font-bold text-gray-800">Session History</h3>
            <span className="ml-auto text-xs text-gray-400">{totalSessions} total</span>
          </div>
          {recent.length === 0
            ? <p className="p-6 text-sm text-gray-400">No sessions yet. Go practice!</p>
            : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      {['Date', 'Passage', 'Lang', 'WPM', 'Accuracy', 'Grade', 'Points'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recent.map(s => (
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                          {s.createdAt?.toDate ? format(s.createdAt.toDate(), 'dd MMM, HH:mm') : '—'}
                        </td>
                        <td className="px-4 py-3 font-medium text-gray-800 max-w-[160px] truncate">{s.passageTitle}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                            ${s.language==='en' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            {s.language === 'en' ? 'EN' : 'MR'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-gray-700">{s.wpm}</td>
                        <td className="px-4 py-3">
                          <span className={`font-bold
                            ${s.accuracy>=85?'text-green-600':s.accuracy>=70?'text-yellow-500':'text-red-500'}`}>
                            {s.accuracy}%
                          </span>
                        </td>
                        <td className="px-4 py-3 font-bold text-primary-600">{s.grade}</td>
                        <td className="px-4 py-3 text-amber-500 font-semibold">{s.points} pts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          }
        </div>
      )}

      {/* ── PROGRESS TAB ─────────────────────────────────────── */}
      {tab === 'progress' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-5">
              <IconTrophy size={18} className="text-primary-500" />
              <h3 className="font-bold text-gray-800">Speed Level Progress</h3>
              <span className="ml-2 text-xs text-gray-400">(3 sessions ≥ 80% to unlock next level)</span>
            </div>
            {SPEED_LEVELS.map(wpm => (
              <SpeedProgressBar
                key={wpm}
                wpm={wpm}
                sessions={sessions}
                unlocked={unlockedSpeeds.includes(wpm)}
              />
            ))}
          </div>

          {/* Achievements */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <h3 className="font-bold text-gray-800 mb-4">Achievements</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[
                { label: 'First Session',     icon: '🎯', earned: totalSessions >= 1 },
                { label: '10 Sessions',        icon: '🔟', earned: totalSessions >= 10 },
                { label: '50 Sessions',        icon: '🏅', earned: totalSessions >= 50 },
                { label: '90%+ Accuracy',      icon: '⭐', earned: sessions.some(s=>s.accuracy>=90) },
                { label: 'Bilingual',          icon: '🌐', earned: enSessions.length>0 && mrSessions.length>0 },
                { label: '7-Day Streak',       icon: '🔥', earned: (userProfile?.streak||0)>=7 },
                { label: '100 WPM Unlocked',   icon: '💨', earned: unlockedSpeeds.includes(100) },
                { label: '120 WPM Unlocked',   icon: '🚀', earned: unlockedSpeeds.includes(120) },
                { label: 'Perfect Score',      icon: '💯', earned: sessions.some(s=>s.accuracy>=99) },
              ].map(({ label, icon, earned }) => (
                <div key={label}
                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all
                    ${earned ? 'border-primary-200 bg-primary-50' : 'border-gray-100 bg-gray-50 opacity-50'}`}>
                  <span className="text-xl">{icon}</span>
                  <span className={`text-xs font-semibold ${earned ? 'text-primary-700' : 'text-gray-400'}`}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
