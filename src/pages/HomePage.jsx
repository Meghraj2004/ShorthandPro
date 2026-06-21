// src/pages/HomePage.jsx
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import tablerIcons from '../icons/tablerIcons';

const {
  IconHeadphones, IconFileText, IconKeyboard, IconChartLine,
  IconTrophy, IconShield, IconArrowRight, IconPlayerPlay,
} = tablerIcons;

const FEATURES = [
  { icon: IconHeadphones, title: 'Recorded Dictations',  desc: 'High-quality audio at 60–160 WPM in English & Marathi.' },
  { icon: IconFileText,   title: 'Passage Viewer',       desc: 'Reveal the original text after attempting to self-evaluate.' },
  { icon: IconKeyboard,   title: 'Typing Translator',    desc: 'Type your shorthand translation for AI accuracy checking.' },
  { icon: IconChartLine,  title: 'Progress Tracker',     desc: 'Accuracy trends, speed unlocks and session history.' },
  { icon: IconTrophy,     title: 'Weekly Leaderboard',   desc: 'Compete with fellow students ranked by points.' },
  { icon: IconShield,     title: 'Admin Panel',          desc: 'Teachers manage content, users and view analytics.' },
];

const SPEEDS = [60, 80, 100, 120, 140, 160];

export default function HomePage() {
  const { userProfile } = useAuth();

  return (
    <div>
      {/* Hero */}
      <div className="bg-gradient-to-br from-ink via-ink-light to-ink-deep text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(108,99,255,0.3),transparent_70%)]" />
        <div className="max-w-3xl mx-auto text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/10 text-primary-300 text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
            ✦ Your Shorthand Practice Platform
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight mb-5">
            Master <span className="text-primary-400">Shorthand</span><br />Faster Than Ever Before
          </h1>
          <p className="text-white/60 text-lg mb-8 max-w-lg mx-auto">
            Structured dictation practice in English & Marathi with real-time feedback, speed tracking, and smart assessment.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link to="/practice"
              className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 px-6 py-3
                         rounded-xl font-semibold transition-colors shadow-lg shadow-primary-900/30">
              <IconPlayerPlay size={18} /> Start Practice
            </Link>
            <Link to="/dashboard"
              className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3
                         rounded-xl font-semibold transition-colors border border-white/20">
              <IconChartLine size={18} /> My Progress
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap justify-center gap-10 mt-14">
            {[['2,400+','Students Enrolled'],['120+','Dictation Passages'],['6','Speed Levels'],['98%','Pass Rate']].map(([v,l])=>(
              <div key={l} className="text-center">
                <div className="text-3xl font-extrabold">{v}</div>
                <div className="text-white/40 text-sm mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Welcome banner */}
      <div className="bg-primary-50 border-b border-primary-100 px-4 py-3 text-center">
        <p className="text-sm text-primary-700 font-medium">
          Welcome back, <strong>{userProfile?.name?.split(' ')[0]}</strong>! 🎉
          {' '}You're currently practising at <strong>{userProfile?.currentSpeed || 60} WPM</strong>.{' '}
          <Link to="/practice" className="underline font-semibold">Continue →</Link>
        </p>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 py-14">
        <div className="text-center mb-10">
          <h2 className="text-2xl font-bold text-gray-900">Everything You Need to Qualify</h2>
          <p className="text-gray-500 mt-2 text-sm">Built for stenography students preparing for government & competitive exams</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div key={title}
              className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-primary-200
                         hover:shadow-md transition-all group">
              <div className="w-11 h-11 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary-500 group-hover:text-white transition-all">
                <Icon size={22} />
              </div>
              <h3 className="font-bold text-gray-800 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Speed levels CTA */}
      <div className="bg-ink py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="text-primary-400 text-xs font-bold tracking-widest uppercase mb-3">Speed Levels</div>
          <h2 className="text-2xl font-bold text-white mb-6">Progress from 60 to 160 WPM</h2>
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {SPEEDS.map((s, i) => (
              <span key={s}
                className={`px-5 py-2 rounded-full font-bold text-sm transition-all
                  ${i < 2 ? 'bg-primary-500/20 text-primary-300'
                    : i < 4 ? 'bg-primary-500/35 text-primary-200'
                    : 'bg-primary-500/50 text-primary-100'}`}>
                {s} WPM
              </span>
            ))}
          </div>
          <Link to="/practice"
            className="inline-flex items-center gap-2 bg-primary-500 hover:bg-primary-600
                       text-white font-semibold px-8 py-3 rounded-xl transition-colors text-sm">
            Begin Your Practice Session <IconArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
