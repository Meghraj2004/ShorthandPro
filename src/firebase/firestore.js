// src/firebase/firestore.js
// All database read/write operations

import {
  collection, doc, getDoc, getDocs, setDoc, addDoc,
  updateDoc, deleteDoc, query, where, orderBy, limit,
  serverTimestamp, increment, onSnapshot, writeBatch
} from 'firebase/firestore';
import { db } from './config';

// ─── COLLECTIONS ────────────────────────────────────────────────
const USERS      = 'users';
const PASSAGES   = 'passages';
const SESSIONS   = 'sessions';
const RESULTS    = 'results';
const LEADERBOARD = 'leaderboard';

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

  await setDoc(doc(db, USERS, uid), {
    uid,
    name:         safeName,
    email:        data.email,
    role:         data.role || 'student',   // 'student' | 'admin'
    language:     data.language || 'en',
    currentSpeed: 60,
    totalSessions: 0,
    totalPoints:   0,
    streak:        0,
    lastActive:    serverTimestamp(),
    createdAt:     serverTimestamp(),
    avatarInitials,
    unlockedSpeeds: [60],
  });
}

export async function getUserProfile(uid) {
  const snap = await getDoc(doc(db, USERS, uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function updateUserProfile(uid, data) {
  await updateDoc(doc(db, USERS, uid), {
    ...data,
    lastActive: serverTimestamp(),
  });
}

export function subscribeUserProfile(uid, callback) {
  return onSnapshot(doc(db, USERS, uid), snap => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() });
  });
}

// Admin: get all users
export async function getAllUsers() {
  const snap = await getDocs(
    query(collection(db, USERS), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function adminUpdateUser(uid, data) {
  await updateDoc(doc(db, USERS, uid), data);
}

export async function deleteUser(uid) {
  await deleteDoc(doc(db, USERS, uid));
}

// ═══════════════════════════════════════════════════════════════
//  PASSAGES
// ═══════════════════════════════════════════════════════════════
// Firestore structure:
// passages/{id} → { title, language, wpm, category, passageText,
//                   audioURL, duration, active, createdAt, uploadedBy }

export async function getPassages({ language, wpm }) {
  const q = query(
    collection(db, PASSAGES),
    where('language', '==', language),
    where('wpm', '==', wpm),
    where('active', '==', true),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getPassage(id) {
  const snap = await getDoc(doc(db, PASSAGES, id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function addPassage(data) {
  return await addDoc(collection(db, PASSAGES), {
    ...data,
    active:    true,
    playCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function updatePassage(id, data) {
  await updateDoc(doc(db, PASSAGES, id), data);
}

export async function deletePassage(id) {
  await updateDoc(doc(db, PASSAGES, id), { active: false });
}

// Admin: get all passages regardless of status
export async function getAllPassages() {
  const snap = await getDocs(
    query(collection(db, PASSAGES), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function incrementPassagePlayCount(id) {
  await updateDoc(doc(db, PASSAGES, id), { playCount: increment(1) });
}

// ═══════════════════════════════════════════════════════════════
//  SESSIONS — one session = one dictation attempt
// ═══════════════════════════════════════════════════════════════
// sessions/{id} → { uid, passageId, passageTitle, language, wpm,
//                   typedText, accuracy, effectiveWpm, grade,
//                   timeTaken, points, createdAt }

export async function saveSession(uid, data) {
  const points = calculatePoints(data.wpm, data.accuracy);

  // 1. Save session record
  const sessionRef = await addDoc(collection(db, SESSIONS), {
    uid,
    ...data,
    points,
    createdAt: serverTimestamp(),
  });

  // 2. Update user stats atomically
  const userRef = doc(db, USERS, uid);
  await setDoc(userRef, {
    totalSessions: increment(1),
    totalPoints:   increment(points),
    lastActive:    serverTimestamp(),
  }, { merge: true });

  // 3. Update leaderboard
  await updateLeaderboard(uid, points);

  // 4. Check and unlock next speed
  if (data.accuracy >= 80) {
    await checkSpeedUnlock(uid, data.wpm);
  }

  return sessionRef.id;
}

function calculatePoints(wpm, accuracy) {
  const speedMultiplier = { 60: 1, 80: 1.5, 100: 2, 120: 2.5, 140: 3, 160: 3.5 };
  const mult = speedMultiplier[wpm] || 1;
  return Math.round((accuracy / 100) * wpm * mult * 10);
}

export async function getUserSessions(uid, limitN = 20) {
  const q = query(
    collection(db, SESSIONS),
    where('uid', '==', uid),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getSessionsByPassage(passageId) {
  const q = query(
    collection(db, SESSIONS),
    where('passageId', '==', passageId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// Admin: all sessions
export async function getAllSessions(limitN = 100) {
  const q = query(
    collection(db, SESSIONS),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

// ═══════════════════════════════════════════════════════════════
//  SPEED UNLOCK LOGIC
// ═══════════════════════════════════════════════════════════════
const SPEED_LEVELS = [60, 80, 100, 120, 140, 160];

async function checkSpeedUnlock(uid, completedWpm) {
  const userSnap = await getDoc(doc(db, USERS, uid));
  if (!userSnap.exists()) return null;

  const user = userSnap.data();
  const unlocked = user.unlockedSpeeds || [60];
  const nextIndex = SPEED_LEVELS.indexOf(completedWpm) + 1;
  if (nextIndex < SPEED_LEVELS.length) {
    const nextSpeed = SPEED_LEVELS[nextIndex];
    // Require 3 sessions at ≥80% accuracy to unlock next speed
    const q = query(
      collection(db, SESSIONS),
      where('uid', '==', uid),
      where('wpm', '==', completedWpm),
      where('accuracy', '>=', 80)
    );
    const snap = await getDocs(q);
    if (snap.size >= 3 && !unlocked.includes(nextSpeed)) {
      await updateDoc(doc(db, USERS, uid), {
        unlockedSpeeds: [...unlocked, nextSpeed],
        currentSpeed: nextSpeed,
      });
      return nextSpeed; // returns newly unlocked speed
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  LEADERBOARD
// ═══════════════════════════════════════════════════════════════
// leaderboard/{uid} → { uid, name, totalPoints, weeklyPoints,
//                       bestAccuracy, bestWpm, avatarInitials }

async function updateLeaderboard(uid, newPoints) {
  const ref = doc(db, LEADERBOARD, uid);
  const snap = await getDoc(ref);
  const userSnap = await getDoc(doc(db, USERS, uid));
  const user = userSnap.exists() ? userSnap.data() : { name: 'Unknown user', avatarInitials: '?' };

  if (snap.exists()) {
    await updateDoc(ref, {
      totalPoints:   increment(newPoints),
      weeklyPoints:  increment(newPoints),
      name:          user.name,
      avatarInitials: user.avatarInitials,
      lastActive:    serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      uid,
      name:           user.name,
      avatarInitials: user.avatarInitials,
      totalPoints:    newPoints,
      weeklyPoints:   newPoints,
      bestAccuracy:   0,
      bestWpm:        0,
      lastActive:     serverTimestamp(),
    });
  }
}

export async function getLeaderboard(limitN = 20) {
  const q = query(
    collection(db, LEADERBOARD),
    orderBy('weeklyPoints', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }));
}

export function subscribeLeaderboard(callback) {
  const q = query(
    collection(db, LEADERBOARD),
    orderBy('weeklyPoints', 'desc'),
    limit(20)
  );
  return onSnapshot(q, snap => {
    const data = snap.docs.map((d, i) => ({ rank: i + 1, id: d.id, ...d.data() }));
    callback(data);
  });
}

// ═══════════════════════════════════════════════════════════════
//  ANALYTICS (Admin)
// ═══════════════════════════════════════════════════════════════

export async function getPlatformStats() {
  const [usersSnap, passagesSnap, sessionsSnap] = await Promise.all([
    getDocs(collection(db, USERS)),
    getDocs(query(collection(db, PASSAGES), where('active', '==', true))),
    getDocs(collection(db, SESSIONS)),
  ]);

  const sessions = sessionsSnap.docs.map(d => d.data());
  const avgAccuracy = sessions.length
    ? Math.round(sessions.reduce((s, r) => s + (r.accuracy || 0), 0) / sessions.length)
    : 0;

  // Active today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const activeToday = sessions.filter(s => {
    const ts = s.createdAt?.toDate?.();
    return ts && ts >= today;
  });
  const activeUids = new Set(activeToday.map(s => s.uid)).size;

  return {
    totalStudents:  usersSnap.size,
    totalPassages:  passagesSnap.size,
    totalSessions:  sessions.length,
    avgAccuracy,
    activeToday:    activeUids,
  };
}

export async function getRecentActivity(limitN = 50) {
  const q = query(
    collection(db, SESSIONS),
    orderBy('createdAt', 'desc'),
    limit(limitN)
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}
