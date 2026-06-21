// src/pages/AdminPage.jsx
import { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  getAllUsers, getAllPassages, getPlatformStats, getRecentActivity,
  addPassage, updatePassage, deletePassage, adminUpdateUser
} from '../lib/database';
import { uploadAudio } from '../lib/storage';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import tablerIcons from '../icons/tablerIcons';

const {
  IconLayoutDashboard, IconUsers, IconFileMusic, IconChartBar,
  IconSettings, IconUpload, IconTrash, IconCheck,
  IconX, IconSearch, IconShield, IconDownload,
} = tablerIcons;

// ── Sidebar ──────────────────────────────────────────────────────
const NAV = [
  { to: '/admin',          icon: IconLayoutDashboard, label: 'Overview'  },
  { to: '/admin/students', icon: IconUsers,            label: 'Students'  },
  { to: '/admin/content',  icon: IconFileMusic,        label: 'Content'   },
  { to: '/admin/reports',  icon: IconChartBar,         label: 'Reports'   },
  { to: '/admin/settings', icon: IconSettings,         label: 'Settings'  },
];

function Sidebar() {
  const { pathname } = useLocation();
  return (
    <aside className="w-52 bg-white border-r border-gray-100 flex-shrink-0 hidden md:block">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
          <IconShield size={16} className="text-primary-500" /> Admin Panel
        </div>
      </div>
      <nav className="p-2 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => {
          const active = pathname === to || (to !== '/admin' && pathname.startsWith(to));
          return (
            <Link key={to} to={to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${active ? 'bg-primary-50 text-primary-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}>
              <Icon size={17} /> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

// ── Overview ─────────────────────────────────────────────────────
function Overview() {
  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([getPlatformStats(), getRecentActivity(10)])
      .then(([s, a]) => { setStats(s); setActivity(a); })
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900">Overview</h2>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Students', value: stats?.totalStudents ?? '—', color: 'text-violet-600', bg: 'bg-violet-50' },
          { label: 'Active Today',   value: stats?.activeToday ?? '—',   color: 'text-green-600',  bg: 'bg-green-50'  },
          { label: 'Total Passages', value: stats?.totalPassages ?? '—', color: 'text-blue-600',   bg: 'bg-blue-50'   },
          { label: 'Avg. Accuracy',  value: stats ? `${stats.avgAccuracy}%` : '—', color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className={`text-3xl font-extrabold ${color} mb-1`}>{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent activity table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 font-bold text-gray-800">Recent Student Activity</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Student ID', 'Passage', 'WPM', 'Language', 'Accuracy', 'Grade', 'Date'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activity.map(s => (
                <tr key={s.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-xs text-gray-400 font-mono">{s.uid?.slice(0,8)}…</td>
                  <td className="px-4 py-3 text-gray-700 max-w-[140px] truncate">{s.passageTitle}</td>
                  <td className="px-4 py-3 font-bold">{s.wpm}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${s.language==='en'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                      {s.language==='en'?'EN':'MR'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`font-bold ${s.accuracy>=85?'text-green-600':s.accuracy>=70?'text-yellow-500':'text-red-500'}`}>
                      {s.accuracy}%
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-primary-600">{s.grade}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {s.createdAt?.toDate ? format(s.createdAt.toDate(), 'dd MMM HH:mm') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Students ──────────────────────────────────────────────────────
function Students() {
  const [users, setUsers]     = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllUsers()
      .then(setUsers)
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  async function toggleRole(user) {
    const newRole = user.role === 'admin' ? 'student' : 'admin';
    try {
      await adminUpdateUser(user.uid, { role: newRole });
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
      toast.success(`${user.name} is now ${newRole}`);
    } catch { toast.error('Failed to update role'); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Students ({users.length})</h2>
      </div>
      <div className="relative">
        <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
        <input
          type="text" placeholder="Search by name or email…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                     focus:outline-none focus:ring-2 focus:ring-primary-300"
        />
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Name', 'Email', 'Role', 'Current Speed', 'Total Sessions', 'Points', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white text-xs
                                      flex items-center justify-center font-bold flex-shrink-0">
                        {u.avatarInitials || '?'}
                      </div>
                      <span className="font-medium text-gray-800">{u.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${u.role==='admin'?'bg-primary-100 text-primary-700':'bg-gray-100 text-gray-600'}`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold text-gray-700">{u.currentSpeed} WPM</td>
                  <td className="px-4 py-3 text-gray-600">{u.totalSessions || 0}</td>
                  <td className="px-4 py-3 text-amber-500 font-semibold">{u.totalPoints || 0}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleRole(u)}
                      className="text-xs px-3 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium transition-colors">
                      {u.role==='admin' ? 'Make Student' : 'Make Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Content Manager ───────────────────────────────────────────────
function Content() {
  const { currentUser } = useAuth();
  const [passages, setPassages] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [form, setForm] = useState({
    title: '', language: 'en', wpm: 80, category: '',
    passageText: '', duration: '', audioFile: null,
  });

  async function loadPassages() {
    try {
      const list = await getAllPassages();
      setPassages(list);
    } catch { toast.error('Failed to load passages'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadPassages(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.title || !form.passageText) { toast.error('Title and passage text are required'); return; }
    setUploading(true);
    try {
      let audioURL = '', audioPath = '';
      if (form.audioFile) {
        const res = await uploadAudio(form.audioFile, { language: form.language, wpm: form.wpm }, setUploadPct);
        audioURL  = res.url;
        audioPath = res.path;
      }
      await addPassage({
        title:       form.title,
        language:    form.language,
        wpm:         Number(form.wpm),
        category:    form.category,
        passageText: form.passageText,
        duration:    form.duration,
        audioURL,
        audioPath,
        uploadedBy:  currentUser.uid,
      });
      toast.success('Passage uploaded successfully!');
      setShowForm(false);
      setForm({ title:'',language:'en',wpm:80,category:'',passageText:'',duration:'',audioFile:null });
      setUploadPct(0);
      loadPassages();
    } catch (err) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleToggleActive(passage) {
    try {
      await updatePassage(passage.id, { active: !passage.active });
      setPassages(prev => prev.map(p => p.id === passage.id ? { ...p, active: !p.active } : p));
      toast.success(passage.active ? 'Passage deactivated' : 'Passage activated');
    } catch { toast.error('Failed to update'); }
  }

  async function handleDelete(passage) {
    if (!window.confirm(`Delete "${passage.title}"? This cannot be undone.`)) return;
    try {
      await deletePassage(passage.id);
      setPassages(prev => prev.filter(p => p.id !== passage.id));
      toast.success('Passage deleted');
    } catch { toast.error('Failed to delete'); }
  }

  if (loading) return <Spinner />;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Dictation Content ({passages.length})</h2>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white
                     text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
          {showForm ? <IconX size={16}/> : <IconUpload size={16}/>}
          {showForm ? 'Cancel' : 'Upload Passage'}
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-primary-200 p-6 shadow-sm">
          <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
            <IconUpload size={18} className="text-primary-500" /> Upload New Passage
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Title *</label>
                <input value={form.title} onChange={set('title')} required
                  placeholder="e.g. General Knowledge — Set 05"
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Category</label>
                <input value={form.category} onChange={set('category')}
                  placeholder="e.g. Govt / Economy / Science"
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Language *</label>
                <select value={form.language} onChange={set('language')} className="input-field">
                  <option value="en">🇬🇧 English</option>
                  <option value="mr">🇮🇳 Marathi</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Speed (WPM) *</label>
                <select value={form.wpm} onChange={set('wpm')} className="input-field">
                  {[60,80,100,120,140,160].map(s=><option key={s} value={s}>{s} WPM</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Duration (e.g. 5:00)</label>
                <input value={form.duration} onChange={set('duration')} placeholder="5:00"
                  className="input-field" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Audio File (MP3/WAV)</label>
                <input type="file" accept="audio/*"
                  onChange={e => setForm(f => ({ ...f, audioFile: e.target.files[0] }))}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-1.5 file:px-3
                             file:rounded-lg file:border-0 file:bg-primary-50 file:text-primary-600
                             file:font-semibold hover:file:bg-primary-100 cursor-pointer" />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide block mb-1">Passage Text *</label>
              <textarea value={form.passageText} onChange={set('passageText')} required rows={5}
                placeholder="Paste the full dictation passage text here…"
                className="input-field resize-none" />
            </div>

            {uploading && (
              <div>
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>Uploading…</span><span>{uploadPct}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full transition-all" style={{ width: `${uploadPct}%` }} />
                </div>
              </div>
            )}

            <button type="submit" disabled={uploading}
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 disabled:opacity-50
                         text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
              <IconCheck size={16} />
              {uploading ? 'Uploading…' : 'Save Passage'}
            </button>
          </form>
        </div>
      )}

      {/* Passages table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Title','Lang','WPM','Category','Plays','Status','Actions'].map(h=>(
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {passages.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800 max-w-[200px]">
                    <div className="truncate">{p.title}</div>
                    {p.duration && <div className="text-xs text-gray-400">{p.duration}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${p.language==='en'?'bg-blue-100 text-blue-700':'bg-green-100 text-green-700'}`}>
                      {p.language==='en'?'EN':'MR'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-bold">{p.wpm}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{p.category || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{p.playCount || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold
                      ${p.active?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>
                      {p.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => handleToggleActive(p)}
                        className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-colors"
                        title={p.active ? 'Deactivate' : 'Activate'}>
                        {p.active ? <IconX size={14}/> : <IconCheck size={14}/>}
                      </button>
                      <button onClick={() => handleDelete(p)}
                        className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                        title="Delete">
                        <IconTrash size={14}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {passages.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400 text-sm">No passages yet. Upload your first dictation!</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Reports ────────────────────────────────────────────────────────
function Reports() {
  const [stats, setStats] = useState(null);
  useEffect(() => { getPlatformStats().then(setStats).catch(()=>{}); }, []);

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Reports & Analytics</h2>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: 'Total Students',   value: stats?.totalStudents ?? '…' },
          { label: 'Total Sessions',   value: stats?.totalSessions ?? '…' },
          { label: 'Platform Avg Acc', value: stats ? `${stats.avgAccuracy}%` : '…' },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-100 p-5 text-center shadow-sm">
            <div className="text-3xl font-extrabold text-primary-600 mb-1">{value}</div>
            <div className="text-sm text-gray-500">{label}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <h3 className="font-bold text-gray-800 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          {['Student Report','Accuracy Report','Usage Analytics','Session Logs'].map(r=>(
            <button key={r} onClick={() => toast.success(`Exporting ${r}…`)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200
                         text-gray-700 text-sm font-medium rounded-xl transition-colors">
              <IconDownload size={14}/> {r}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">CSV/PDF export feature — connect to a backend function or use Firebase Extensions for scheduled exports.</p>
      </div>
    </div>
  );
}

// ── Settings ──────────────────────────────────────────────────────
function Settings() {
  const [settings, setSettings] = useState({
    selfRegistration: true,
    showPassageAfter: true,
    leaderboardEnabled: true,
    requireAccuracyToUnlock: true,
    unlockThreshold: 80,
    sessionsToUnlock: 3,
  });

  function toggle(k) { setSettings(s => ({ ...s, [k]: !s[k] })); }

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-bold text-gray-900">Platform Settings</h2>
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm space-y-4">
        {[
          { key: 'selfRegistration',       label: 'Allow student self-registration' },
          { key: 'showPassageAfter',        label: 'Show passage text after attempt' },
          { key: 'leaderboardEnabled',      label: 'Enable leaderboard' },
          { key: 'requireAccuracyToUnlock', label: 'Require accuracy threshold to unlock next speed' },
        ].map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <span className="text-sm font-medium text-gray-700">{label}</span>
            <button onClick={() => toggle(key)}
              className={`relative w-12 h-6 rounded-full transition-colors
                ${settings[key] ? 'bg-primary-500' : 'bg-gray-200'}`}>
              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all
                ${settings[key] ? 'left-7' : 'left-1'}`} />
            </button>
          </div>
        ))}

        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Accuracy Unlock Threshold (%)
            </label>
            <input type="number" min={50} max={100}
              value={settings.unlockThreshold}
              onChange={e => setSettings(s => ({ ...s, unlockThreshold: Number(e.target.value) }))}
              className="input-field w-full" />
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide block mb-1">
              Sessions Required to Unlock Next Speed
            </label>
            <input type="number" min={1} max={10}
              value={settings.sessionsToUnlock}
              onChange={e => setSettings(s => ({ ...s, sessionsToUnlock: Number(e.target.value) }))}
              className="input-field w-full" />
          </div>
        </div>

        <button onClick={() => toast.success('Settings saved!')}
          className="bg-primary-500 hover:bg-primary-600 text-white font-semibold
                     px-6 py-2.5 rounded-xl text-sm transition-colors">
          Save Settings
        </button>
      </div>
    </div>
  );
}

// ── Spinner ──────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex justify-center py-16">
      <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

// ── Admin Page Shell ──────────────────────────────────────────────
export default function AdminPage() {
  return (
    <div className="flex min-h-[calc(100vh-64px)]">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50 overflow-auto">
        <Routes>
          <Route index          element={<Overview />} />
          <Route path="students" element={<Students />} />
          <Route path="content"  element={<Content />} />
          <Route path="reports"  element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*"        element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
