import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(name, email, password, role = 'student') {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set the environment variables.');
    }

    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name }
      }
    });

    if (error) throw error;
    if (!user) throw new Error('Registration failed');

    const safeName = name.trim() || 'Student';
    const avatarInitials = safeName
      .split(/\s+/)
      .map(n => n[0])
      .filter(Boolean)
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'S';

    const { error: profileError } = await supabase
      .from('users')
      .insert({
        uid: user.id,
        name: safeName,
        email: email,
        role: role,
        avatar_initials: avatarInitials,
        unlocked_speeds: [60],
        current_speed: 60,
      });

    if (profileError) throw profileError;
    return { user };
  }

  async function login(email, password) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set the environment variables.');
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  async function logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setCurrentUser(null);
    setUserProfile(null);
  }

  async function resetPassword(email) {
    if (!isSupabaseConfigured) {
      throw new Error('Supabase is not configured. Please set the environment variables.');
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  }

  async function fetchUserProfile(uid) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('uid', uid)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
    return data;
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChanged(async (session) => {
      setCurrentUser(session?.user ?? null);

      if (session?.user) {
        const profile = await fetchUserProfile(session.user.id);
        setUserProfile(profile ? {
          ...profile,
          avatarInitials: profile.avatar_initials,
          currentSpeed: profile.current_speed,
          totalSessions: profile.total_sessions,
          totalPoints: profile.total_points,
          unlockedSpeeds: profile.unlocked_speeds,
          lastActive: profile.last_active,
          createdAt: profile.created_at,
        } : null);
      } else {
        setUserProfile(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
