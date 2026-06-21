// src/pages/PracticePage.jsx
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getPassages, saveSession, incrementPassagePlayCount } from '../lib/database';
import toast from 'react-hot-toast';
import tablerIcons from '../icons/tablerIcons';

const {
  IconPlayerPlay, IconPlayerPause, IconPlayerSkipBack, IconPlayerSkipForward,
  IconRewind, IconFastForward, IconEye, IconEyeOff, IconCheck, IconRefresh,
  IconArrowRight, IconHeadphones, IconKeyboard, IconLock,
} = tablerIcons;

const SPEED_LEVELS = [60, 80, 100, 120, 140, 160];

function gradeFromAccuracy(acc) {
  if (acc >= 95) return 'A+';
  if (acc >= 88) return 'A';
  if (acc >= 80) return 'B+';
  if (acc >= 70) return 'B';
  if (acc >= 60) return 'C';
  return 'D';
}

function gradeColor(grade) {
  return { 'A+': 'text-green-600', A: 'text-green-500', 'B+': 'text-blue-500',
           B: 'text-yellow-500', C: 'text-orange-500', D: 'text-red-500' }[grade] || '';
}

function computeAccuracy(original, typed) {
  if (!original || !typed) return 0;
  const origWords  = original.toLowerCase().trim().split(/\s+/);
  const typedWords = typed.toLowerCase().trim().split(/\s+/);
  if (!typedWords[0]) return 0;
  let correct = 0;
  const len = Math.min(origWords.length, typedWords.length);
  for (let i = 0; i < len; i++) {
    if (origWords[i] === typedWords[i]) correct++;
  }
  // Penalise for extra words beyond the passage
  const extra = Math.max(0, typedWords.length - origWords.length);
  return Math.max(0, Math.round(((correct - extra * 0.5) / origWords.length) * 100));
}

// ─── Audio Player ────────────────────────────────────────────────
function AudioPlayer({ passage, onComplete }) {
  const audioRef  = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);
  const [pbRate, setPbRate]   = useState(1);

  useEffect(() => {
    setPlaying(false); setCurrent(0);
  }, [passage]);

  function fmt(s) {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  }

  function togglePlay() {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else         { audioRef.current.play();  setPlaying(true);  }
  }

  function seek(e) {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct  = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  }

  function changeRate(r) {
    setPbRate(r);
    if (audioRef.current) audioRef.current.playbackRate = r;
  }

  function skip(sec) {
    if (!audioRef.current) return;
    audioRef.current.currentTime = Math.max(0, Math.min(duration, audioRef.current.currentTime + sec));
  }

  const pct = duration ? (current / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {passage?.audioURL ? (
        <audio
          ref={audioRef}
          src={passage.audioURL}
          onTimeUpdate={() => setCurrent(audioRef.current?.currentTime || 0)}
          onLoadedMetadata={() => setDuration(audioRef.current?.duration || 0)}
          onEnded={() => { setPlaying(false); onComplete?.(); }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-700 flex items-center gap-2">
          <IconHeadphones size={16} />
          No audio uploaded yet for this passage.
        </div>
      )}

      {/* Waveform / Progress */}
      <div className="bg-gray-50 rounded-xl p-4">
        {playing && (
          <div className="flex items-center gap-1 justify-center mb-3">
            {[16,24,12,20,10,18,14].map((h, i) => (
              <span key={i}
                style={{ height: h, animationDelay: `${i * 0.1}s` }}
                className="block w-1 bg-primary-500 rounded-full animate-pulse" />
            ))}
          </div>
        )}

        {/* Seek bar */}
        <div
          className="h-2 bg-gray-200 rounded-full cursor-pointer relative mb-2"
          onClick={seek}
        >
          <div
            className="h-full bg-primary-500 rounded-full relative transition-all"
            style={{ width: `${pct}%` }}
          >
            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4
                            bg-primary-500 rounded-full border-2 border-white shadow" />
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400">
          <span>{fmt(current)}</span>
          <span>{fmt(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-3">
        <button onClick={() => { if(audioRef.current) audioRef.current.currentTime=0; }}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <IconPlayerSkipBack size={16} />
        </button>
        <button onClick={() => skip(-10)}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <IconRewind size={16} />
        </button>
        <button
          onClick={togglePlay}
          className="w-14 h-14 rounded-full bg-primary-500 hover:bg-primary-600
                     flex items-center justify-center text-white shadow-lg transition-colors">
          {playing ? <IconPlayerPause size={24} /> : <IconPlayerPlay size={24} />}
        </button>
        <button onClick={() => skip(10)}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <IconFastForward size={16} />
        </button>
        <button onClick={() => {}}
          className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
          <IconPlayerSkipForward size={16} />
        </button>
      </div>

      {/* Playback speed */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <span>Speed:</span>
        {[0.5, 0.75, 1, 1.25, 1.5].map(r => (
          <button key={r} onClick={() => changeRate(r)}
            className={`px-2 py-1 rounded-md font-medium transition-colors
              ${pbRate === r ? 'bg-primary-500 text-white' : 'bg-gray-100 hover:bg-gray-200'}`}>
            {r}×
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function PracticePage() {
  const { currentUser, userProfile } = useAuth();
  const [lang, setLang]           = useState('en');
  const [speed, setSpeed]         = useState(80);
  const [passages, setPassages]   = useState([]);
  const [passage, setPassage]     = useState(null);
  const [loading, setLoading]     = useState(false);
  const [showPassage, setShowPassage] = useState(false);
  const [typed, setTyped]         = useState('');
  const [result, setResult]       = useState(null);
  const [saving, setSaving]       = useState(false);

  const unlockedSpeeds = userProfile?.unlockedSpeeds || [60];

  // Fetch passages when lang or speed changes
  useEffect(() => {
    async function load() {
      setLoading(true);
      setPassage(null);
      setResult(null);
      setTyped('');
      setShowPassage(false);
      try {
        const list = await getPassages({ language: lang, wpm: speed });
        setPassages(list);
        if (list.length) setPassage(list[0]);
      } catch {
        toast.error('Failed to load passages');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [lang, speed]);

  function handleSpeedSelect(s) {
    if (!unlockedSpeeds.includes(s)) {
      toast.error(`Complete ${s - 20} WPM with ≥80% accuracy in 3 sessions to unlock ${s} WPM`);
      return;
    }
    setSpeed(s);
  }

  async function handleCheck() {
    if (!currentUser?.uid) { toast.error('You need to be signed in to save a session.'); return; }
    if (!passage?.id) { toast.error('No passage is selected.'); return; }
    if (!typed.trim()) { toast.error('Please type your translation first'); return; }
    const acc     = computeAccuracy(passage?.passageText || '', typed);
    const effWpm  = Math.round(speed * acc / 100);
    const grade   = gradeFromAccuracy(acc);
    const res     = { acc, effWpm, grade };
    setResult(res);

    setSaving(true);
    try {
      await saveSession(currentUser.uid, {
        passageId:    passage.id,
        passageTitle: passage.title,
        language:     lang,
        wpm:          speed,
        typedText:    typed,
        accuracy:     acc,
        effectiveWpm: effWpm,
        grade,
        wordCount:    typed.trim().split(/\s+/).length,
      });
      toast.success('Session saved!');
      if (passage?.id) incrementPassagePlayCount(passage.id);
    } catch {
      toast.error('Could not save session');
    } finally {
      setSaving(false);
    }
  }

  function handleNext() {
    const idx = passages.indexOf(passage);
    const next = passages[(idx + 1) % passages.length];
    setPassage(next);
    setTyped('');
    setResult(null);
    setShowPassage(false);
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">

      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Session</h1>
          <p className="text-gray-500 text-sm mt-1">Select speed, listen, write shorthand, then type your translation.</p>
        </div>
        {/* Language toggle */}
        <div className="flex gap-2">
          {[{k:'en',label:'🇬🇧 English'},{k:'mr',label:'🇮🇳 Marathi'}].map(({k,label})=>(
            <button key={k} onClick={() => setLang(k)}
              className={`px-4 py-2 rounded-full text-sm font-semibold border-2 transition-all
                ${lang===k ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'}`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Speed selector */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-6">
        {SPEED_LEVELS.map(s => {
          const locked = !unlockedSpeeds.includes(s);
          return (
            <button key={s} onClick={() => handleSpeedSelect(s)}
              className={`relative p-4 rounded-xl border-2 text-center transition-all
                ${speed===s ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white hover:border-primary-300'}
                ${locked ? 'opacity-50' : ''}`}>
              {locked && (
                <IconLock size={14} className="absolute top-2 right-2 text-gray-400" />
              )}
              <div className={`text-2xl font-extrabold ${speed===s ? 'text-primary-600' : 'text-gray-800'}`}>{s}</div>
              <div className="text-xs text-gray-400 mt-0.5">WPM</div>
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="grid lg:grid-cols-2 gap-6">

        {/* LEFT: Player + Passage List */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">
                  {loading ? 'Loading…' : passage?.title || 'No passages available'}
                </h3>
                <p className="text-sm text-gray-400 mt-1">
                  {speed} WPM · {lang === 'en' ? 'English' : 'Marathi'}
                  {passage?.category ? ` · ${passage.category}` : ''}
                  {passage?.duration ? ` · ${passage.duration}` : ''}
                </p>
              </div>
            </div>

            <AudioPlayer
              passage={passage}
              onComplete={() => toast.success('Dictation ended! Now type your translation.')}
            />

            {/* Show passage toggle */}
            {passage && (
              <div className="mt-4">
                <button
                  onClick={() => setShowPassage(!showPassage)}
                  className="flex items-center gap-2 text-sm font-semibold text-primary-500 hover:text-primary-600"
                >
                  {showPassage ? <IconEyeOff size={16}/> : <IconEye size={16}/>}
                  {showPassage ? 'Hide Passage' : 'Show Original Passage'}
                </button>
                {showPassage && (
                  <div className="mt-3 bg-gray-50 rounded-xl p-4 text-sm text-gray-700 leading-relaxed max-h-48 overflow-y-auto border border-gray-100">
                    {passage.passageText}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Passage list */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              All {speed} WPM Passages — {lang === 'en' ? 'English' : 'Marathi'}
            </h4>
            {loading ? (
              <p className="text-sm text-gray-400">Loading passages…</p>
            ) : passages.length === 0 ? (
              <p className="text-sm text-gray-400">No passages available. Ask your admin to upload some.</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {passages.map(p => (
                  <button key={p.id} onClick={() => { setPassage(p); setTyped(''); setResult(null); setShowPassage(false); }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all border
                      ${passage?.id===p.id ? 'border-primary-300 bg-primary-50' : 'border-transparent hover:bg-gray-50'}`}>
                    <IconHeadphones size={16} className="text-primary-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">{p.title}</div>
                      <div className="text-xs text-gray-400">{p.category}</div>
                    </div>
                    <IconPlayerPlay size={14} className="text-gray-300" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Typing + Result */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <IconKeyboard size={18} className="text-primary-500" />
              <h3 className="font-bold text-gray-900">Type Your Translation</h3>
            </div>
            <p className="text-sm text-gray-400 mb-3">
              Listen to the dictation, write your shorthand outlines on paper, then type your final translation here.
            </p>
            <textarea
              value={typed}
              onChange={e => setTyped(e.target.value)}
              placeholder="Start typing your translation of the dictation here…"
              rows={8}
              className="w-full border-2 border-gray-200 rounded-xl p-4 text-sm leading-relaxed
                         focus:outline-none focus:border-primary-400 resize-none text-gray-800
                         placeholder:text-gray-300 font-sans"
            />
            <div className="flex items-center justify-between mt-3 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-medium">
                  {typed.trim() ? typed.trim().split(/\s+/).length : 0} words
                </span>
                <span className="text-xs bg-gray-100 px-3 py-1 rounded-full text-gray-600 font-medium">
                  {typed.length} chars
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setTyped(''); setResult(null); }}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
                  <IconRefresh size={14} /> Clear
                </button>
                <button onClick={handleCheck} disabled={saving || !passage}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600
                             disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors">
                  <IconCheck size={16} />
                  {saving ? 'Saving…' : 'Check Accuracy'}
                </button>
              </div>
            </div>
          </div>

          {/* Result card */}
          {result && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
              <h4 className="font-bold text-gray-900 mb-4">Session Result</h4>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className={`text-3xl font-extrabold ${result.acc>=80?'text-green-500':result.acc>=60?'text-yellow-500':'text-red-500'}`}>
                    {result.acc}%
                  </div>
                  <div className="text-xs text-gray-400 mt-1">Accuracy</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className="text-3xl font-extrabold text-primary-600">{result.effWpm}</div>
                  <div className="text-xs text-gray-400 mt-1">Eff. WPM</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <div className={`text-3xl font-extrabold ${gradeColor(result.grade)}`}>{result.grade}</div>
                  <div className="text-xs text-gray-400 mt-1">Grade</div>
                </div>
              </div>

              {/* Feedback */}
              <div className={`rounded-xl p-3 text-sm mb-4
                ${result.acc>=80 ? 'bg-green-50 text-green-800 border border-green-100'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-100'}`}>
                {result.acc >= 95 && 'Outstanding! You\'re performing at expert level. Consider moving to the next speed.'}
                {result.acc >= 88 && result.acc < 95 && 'Great work! Consistent accuracy at this level. Try a few more sessions to solidify.'}
                {result.acc >= 80 && result.acc < 88 && 'Good effort! Focus on proper nouns and punctuation. You\'re on track.'}
                {result.acc >= 70 && result.acc < 80 && 'Decent attempt. Increase practice frequency. Pay attention to spelling.'}
                {result.acc < 70 && 'Keep practising! Slow down during dictation and focus on clarity first.'}
              </div>

              <div className="flex gap-2">
                <button onClick={handleNext}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-primary-500
                             hover:bg-primary-600 text-white text-sm font-semibold rounded-xl transition-colors">
                  Next Passage <IconArrowRight size={16} />
                </button>
                <button onClick={() => { setTyped(''); setResult(null); setShowPassage(false); }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600
                             text-sm font-medium rounded-xl transition-colors">
                  Retry
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
