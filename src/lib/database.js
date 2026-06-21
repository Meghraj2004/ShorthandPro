import { supabase } from './supabase';

const SPEED_LEVELS = [60, 80, 100, 120, 140, 160];

// ═══════════════════════════════════════════════════════════════
//  USER PROFILE
// ═══════════════════════════════════════════════════════════════

export async function createUserProfile(uid, data) {
  const safeName = data.name?.trim() || 'Student';
  const avatarInitials = safeName
    .split(/\s+/)
    .map(n => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'S';

  const { data: user, error } = await supabase
    .from('users')
    .insert({
      uid,
      name: safeName,
      email: data.email,
      role: data.role || 'student',
      language: data.language || 'en',
      current_speed: 60,
      total_sessions: 0,
      total_points: 0,
      streak: 0,
      avatar_initials: avatarInitials,
      unlocked_speeds: [60],
    })
    .select()
    .single();

  if (error) throw error;
  return user;
}

export async function getUserProfile(uid) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return transformUserProfile(data);
}

function transformUserProfile(data) {
  if (!data) return null;
  return {
    id: data.id,
    uid: data.uid,
    name: data.name,
    email: data.email,
    role: data.role,
    language: data.language,
    currentSpeed: data.current_speed,
    totalSessions: data.total_sessions,
    totalPoints: data.total_points,
    streak: data.streak,
    avatarInitials: data.avatar_initials,
    unlockedSpeeds: data.unlocked_speeds,
    lastActive: data.last_active,
    createdAt: data.created_at,
  };
}

export async function updateUserProfile(uid, data) {
  const updateData = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.currentSpeed !== undefined) updateData.current_speed = data.currentSpeed;
  if (data.totalSessions !== undefined) updateData.total_sessions = data.totalSessions;
  if (data.totalPoints !== undefined) updateData.total_points = data.totalPoints;
  if (data.streak !== undefined) updateData.streak = data.streak;
  if (data.avatarInitials !== undefined) updateData.avatar_initials = data.avatarInitials;
  if (data.unlockedSpeeds !== undefined) updateData.unlocked_speeds = data.unlockedSpeeds;
  updateData.last_active = new Date().toISOString();

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('uid', uid);

  if (error) throw error;
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformUserProfile);
}

export async function adminUpdateUser(uid, data) {
  const updateData = {};

  if (data.name !== undefined) updateData.name = data.name;
  if (data.role !== undefined) updateData.role = data.role;
  if (data.currentSpeed !== undefined) updateData.current_speed = data.currentSpeed;

  const { error } = await supabase
    .from('users')
    .update(updateData)
    .eq('uid', uid);

  if (error) throw error;
}

export async function deleteUser(uid) {
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('uid', uid);

  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════
//  PASSAGES
// ═══════════════════════════════════════════════════════════════

export async function getPassages({ language, wpm }) {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .eq('language', language)
    .eq('wpm', wpm)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformPassage);
}

function transformPassage(data) {
  if (!data) return null;
  return {
    id: data.id,
    title: data.title,
    language: data.language,
    wpm: data.wpm,
    category: data.category,
    passageText: data.passage_text,
    audioURL: data.audio_url,
    audioPath: data.audio_path,
    duration: data.duration,
    active: data.active,
    playCount: data.play_count,
    uploadedBy: data.uploaded_by,
    createdAt: data.created_at,
  };
}

export async function getPassage(id) {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return transformPassage(data);
}

export async function addPassage(data) {
  const { data: passage, error } = await supabase
    .from('passages')
    .insert({
      title: data.title,
      language: data.language,
      wpm: data.wpm,
      category: data.category,
      passage_text: data.passageText,
      audio_url: data.audioURL,
      audio_path: data.audioPath,
      duration: data.duration,
      uploaded_by: data.uploadedBy,
      active: true,
      play_count: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return passage;
}

export async function updatePassage(id, data) {
  const updateData = {};

  if (data.title !== undefined) updateData.title = data.title;
  if (data.language !== undefined) updateData.language = data.language;
  if (data.wpm !== undefined) updateData.wpm = data.wpm;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.passageText !== undefined) updateData.passage_text = data.passageText;
  if (data.audioURL !== undefined) updateData.audio_url = data.audioURL;
  if (data.audioPath !== undefined) updateData.audio_path = data.audioPath;
  if (data.duration !== undefined) updateData.duration = data.duration;
  if (data.active !== undefined) updateData.active = data.active;
  if (data.playCount !== undefined) updateData.play_count = data.playCount;

  const { error } = await supabase
    .from('passages')
    .update(updateData)
    .eq('id', id);

  if (error) throw error;
}

export async function deletePassage(id) {
  const { error } = await supabase
    .from('passages')
    .update({ active: false })
    .eq('id', id);

  if (error) throw error;
}

export async function getAllPassages() {
  const { data, error } = await supabase
    .from('passages')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformPassage);
}

export async function incrementPassagePlayCount(id) {
  const { data: passage, error: fetchError } = await supabase
    .from('passages')
    .select('play_count')
    .eq('id', id)
    .single();

  if (fetchError) throw fetchError;

  const { error } = await supabase
    .from('passages')
    .update({ play_count: (passage.play_count || 0) + 1 })
    .eq('id', id);

  if (error) throw error;
}

// ═══════════════════════════════════════════════════════════════
//  SESSIONS
// ═══════════════════════════════════════════════════════════════

export async function saveSession(uid, data) {
  const points = calculatePoints(data.wpm, data.accuracy);

  // 1. Save session record
  const { data: session, error: sessionError } = await supabase
    .from('sessions')
    .insert({
      uid,
      passage_id: data.passageId,
      passage_title: data.passageTitle,
      language: data.language,
      wpm: data.wpm,
      typed_text: data.typedText,
      accuracy: data.accuracy,
      effective_wpm: data.effectiveWpm,
      grade: data.grade,
      word_count: data.wordCount,
      points,
    })
    .select()
    .single();

  if (sessionError) throw sessionError;

  // 2. Update user stats
  const { data: user, error: userFetchError } = await supabase
    .from('users')
    .select('total_sessions, total_points')
    .eq('uid', uid)
    .single();

  if (userFetchError) throw userFetchError;

  await supabase
    .from('users')
    .update({
      total_sessions: (user.total_sessions || 0) + 1,
      total_points: (user.total_points || 0) + points,
      last_active: new Date().toISOString(),
    })
    .eq('uid', uid);

  // 3. Update leaderboard
  await updateLeaderboard(uid, points);

  // 4. Check speed unlock
  if (data.accuracy >= 80) {
    await checkSpeedUnlock(uid, data.wpm);
  }

  return session.id;
}

function calculatePoints(wpm, accuracy) {
  const speedMultiplier = { 60: 1, 80: 1.5, 100: 2, 120: 2.5, 140: 3, 160: 3.5 };
  const mult = speedMultiplier[wpm] || 1;
  return Math.round((accuracy / 100) * wpm * mult * 10);
}

export async function getUserSessions(uid, limitN = 20) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('uid', uid)
    .order('created_at', { ascending: false })
    .limit(limitN);

  if (error) throw error;
  return data.map(transformSession);
}

function transformSession(data) {
  if (!data) return null;
  return {
    id: data.id,
    uid: data.uid,
    passageId: data.passage_id,
    passageTitle: data.passage_title,
    language: data.language,
    wpm: data.wpm,
    typedText: data.typed_text,
    accuracy: data.accuracy,
    effectiveWpm: data.effective_wpm,
    grade: data.grade,
    wordCount: data.word_count,
    points: data.points,
    createdAt: { toDate: () => new Date(data.created_at) },
  };
}

export async function getSessionsByPassage(passageId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('passage_id', passageId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(transformSession);
}

export async function getAllSessions(limitN = 100) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitN);

  if (error) throw error;
  return data.map(transformSession);
}

// ═══════════════════════════════════════════════════════════════
//  SPEED UNLOCK LOGIC
// ═══════════════════════════════════════════════════════════════

async function checkSpeedUnlock(uid, completedWpm) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('*')
    .eq('uid', uid)
    .single();

  if (userError) return null;

  const unlocked = user.unlocked_speeds || [60];
  const nextIndex = SPEED_LEVELS.indexOf(completedWpm) + 1;

  if (nextIndex < SPEED_LEVELS.length) {
    const nextSpeed = SPEED_LEVELS[nextIndex];

    const { data: sessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('id')
      .eq('uid', uid)
      .eq('wpm', completedWpm)
      .gte('accuracy', 80);

    if (sessionsError) return null;

    if (sessions.length >= 3 && !unlocked.includes(nextSpeed)) {
      await supabase
        .from('users')
        .update({
          unlocked_speeds: [...unlocked, nextSpeed],
          current_speed: nextSpeed,
        })
        .eq('uid', uid);

      return nextSpeed;
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════════════════════════

async function updateLeaderboard(uid, newPoints) {
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('name, avatar_initials')
    .eq('uid', uid)
    .single();

  if (userError) return;

  const { data: existing, error: lbError } = await supabase
    .from('leaderboard')
    .select('*')
    .eq('uid', uid)
    .single();

  if (lbError && lbError.code !== 'PGRST116') return;

  if (existing) {
    await supabase
      .from('leaderboard')
      .update({
        total_points: (existing.total_points || 0) + newPoints,
        weekly_points: (existing.weekly_points || 0) + newPoints,
        name: user.name,
        avatar_initials: user.avatar_initials,
        last_active: new Date().toISOString(),
      })
      .eq('uid', uid);
  } else {
    await supabase
      .from('leaderboard')
      .insert({
        uid,
        name: user.name,
        avatar_initials: user.avatar_initials,
        total_points: newPoints,
        weekly_points: newPoints,
        best_accuracy: 0,
        best_wpm: 0,
      });
  }
}

export async function getLeaderboard(limitN = 20) {
  const { data, error } = await supabase
    .from('leaderboard')
    .select('*')
    .order('weekly_points', { ascending: false })
    .limit(limitN);

  if (error) throw error;
  return data.map((d, i) => ({
    rank: i + 1,
    id: d.id,
    uid: d.uid,
    name: d.name,
    avatarInitials: d.avatar_initials,
    totalPoints: d.total_points,
    weeklyPoints: d.weekly_points,
    bestAccuracy: d.best_accuracy,
    bestWpm: d.best_wpm,
  }));
}

export function subscribeLeaderboard(callback) {
  const channel = supabase
    .channel('leaderboard-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'leaderboard' },
      async () => {
        const data = await getLeaderboard(20);
        callback(data);
      }
    )
    .subscribe();

  getLeaderboard(20).then(callback);

  return () => {
    supabase.removeChannel(channel);
  };
}

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS (Admin)
// ═══════════════════════════════════════════════════════════════

export async function getPlatformStats() {
  const [usersResult, passagesResult, sessionsResult] = await Promise.all([
    supabase.from('users').select('id'),
    supabase.from('passages').select('id').eq('active', true),
    supabase.from('sessions').select('accuracy, created_at, uid'),
  ]);

  if (usersResult.error) throw usersResult.error;
  if (passagesResult.error) throw passagesResult.error;
  if (sessionsResult.error) throw sessionsResult.error;

  const sessions = sessionsResult.data;
  const avgAccuracy = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + (r.accuracy || 0), 0) / sessions.length)
    : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = sessions.filter(s => {
    const ts = new Date(s.created_at);
    return ts >= today;
  });
  const activeUids = new Set(activeToday.map(s => s.uid)).size;

  return {
    totalStudents: usersResult.data.length,
    totalPassages: passagesResult.data.length,
    totalSessions: sessions.length,
    avgAccuracy,
    activeToday: activeUids,
  };
}

export async function getRecentActivity(limitN = 50) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limitN);

  if (error) throw error;
  return data.map(transformSession);
}
