import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function register(name, email, password, role = 'student') {
    const { data: { user }, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) throw error;
    if (!user) throw new Error('Registration failed - check your email for confirmation');

    return { user };
  }

  async function login(email, password) {
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
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) throw error;
  }

  async function fetchUserProfile(uid) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', uid)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      return data;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }

  async function getInitialSession() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    } catch (err) {
      console.error('Error getting session:', err);
      return null;
    }
  }

  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      try {
        const session = await getInitialSession();

        if (!mounted) return;

        if (session?.user) {
          setCurrentUser(session.user);

          let profile = await fetchUserProfile(session.user.id);

          if (!mounted) return;

          if (profile) {
            setUserProfile({
              ...profile,
              avatarInitials: profile.avatar_initials,
              currentSpeed: profile.current_speed,
              totalSessions: profile.total_sessions,
              totalPoints: profile.total_points,
              unlockedSpeeds: profile.unlocked_speeds,
              lastActive: profile.last_active,
              createdAt: profile.created_at,
            });
          } else {
            const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student';
            const avatarInitials = safeName
              .split(/\s+/)
              .map(n => n[0])
              .filter(Boolean)
              .join('')
              .toUpperCase()
              .slice(0, 2) || 'S';

            const { error: insertError } = await supabase
              .from('users')
              .insert({
                uid: session.user.id,
                name: safeName,
                email: session.user.email,
                role: 'student',
                avatar_initials: avatarInitials,
                unlocked_speeds: [60],
                current_speed: 60,
              });

            if (insertError) {
              console.error('Error creating profile:', insertError);
            } else {
              profile = await fetchUserProfile(session.user.id);
              if (profile && mounted) {
                setUserProfile({
                  ...profile,
                  avatarInitials: profile.avatar_initials,
                  currentSpeed: profile.current_speed,
                  totalSessions: profile.total_sessions,
                  totalPoints: profile.total_points,
                  unlockedSpeeds: profile.unlocked_speeds,
                  lastActive: profile.last_active,
                  createdAt: profile.created_at,
                });
              }
            }
          }
        }
      } catch (err) {
        console.error('Auth init error:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        setCurrentUser(null);
        setUserProfile(null);
        return;
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setCurrentUser(session.user);

        let profile = await fetchUserProfile(session.user.id);

        if (!profile && event === 'SIGNED_IN') {
          const safeName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Student';
          const avatarInitials = safeName
            .split(/\s+/)
            .map(n => n[0])
            .filter(Boolean)
            .join('')
            .toUpperCase()
            .slice(0, 2) || 'S';

          await supabase
            .from('users')
            .insert({
              uid: session.user.id,
              name: safeName,
              email: session.user.email,
              role: 'student',
              avatar_initials: avatarInitials,
              unlocked_speeds: [60],
              current_speed: 60,
            });

          profile = await fetchUserProfile(session.user.id);
        }

        if (profile && mounted) {
          setUserProfile({
            ...profile,
            avatarInitials: profile.avatar_initials,
            currentSpeed: profile.current_speed,
            totalSessions: profile.total_sessions,
            totalPoints: profile.total_points,
            unlockedSpeeds: profile.unlocked_speeds,
            lastActive: profile.last_active,
            createdAt: profile.created_at,
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
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
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Loading...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
