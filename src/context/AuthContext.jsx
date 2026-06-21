// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../firebase/config';
import { createUserProfile, getUserProfile } from '../firebase/firestore';

const AuthContext = createContext(null);

function requireFirebaseConfigured() {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase is not configured. Set the REACT_APP_FIREBASE_* environment variables or replace the placeholders in src/firebase/config.js.');
  }
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Register new student
  async function register(name, email, password, role = 'student') {
    requireFirebaseConfigured();
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await createUserProfile(cred.user.uid, { name, email, role });
    return cred;
  }

  // Login
  async function login(email, password) {
    requireFirebaseConfigured();
    return await signInWithEmailAndPassword(auth, email, password);
  }

  // Logout
  async function logout() {
    await signOut(auth);
    setCurrentUser(null);
    setUserProfile(null);
  }

  // Reset password
  async function resetPassword(email) {
    requireFirebaseConfigured();
    await sendPasswordResetEmail(auth, email);
  }

  // Watch auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async user => {
      setCurrentUser(user);
      try {
        if (user) {
          const profile = await getUserProfile(user.uid);
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch {
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    });
    return unsub;
  }, []);

  const value = {
    currentUser,
    userProfile,
    setUserProfile,
    register,
    login,
    logout,
    resetPassword,
    isAdmin: userProfile?.role === 'admin',
    isStudent: userProfile?.role === 'student',
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
