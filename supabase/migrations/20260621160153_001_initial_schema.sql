-- USERS TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Student',
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin')),
  language TEXT NOT NULL DEFAULT 'en',
  current_speed INTEGER NOT NULL DEFAULT 60,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_points INTEGER NOT NULL DEFAULT 0,
  streak INTEGER NOT NULL DEFAULT 0,
  avatar_initials TEXT DEFAULT 'S',
  unlocked_speeds INTEGER[] DEFAULT ARRAY[60],
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_uid ON users(uid);
CREATE INDEX idx_users_email ON users(email);

-- PASSAGES TABLE
CREATE TABLE passages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  language TEXT NOT NULL DEFAULT 'en' CHECK (language IN ('en', 'mr')),
  wpm INTEGER NOT NULL,
  category TEXT,
  passage_text TEXT NOT NULL,
  audio_url TEXT,
  audio_path TEXT,
  duration TEXT,
  active BOOLEAN DEFAULT TRUE,
  play_count INTEGER DEFAULT 0,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_passages_lang_wpm ON passages(language, wpm, active);
CREATE INDEX idx_passages_created ON passages(created_at DESC);

-- SESSIONS TABLE
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID NOT NULL,
  passage_id UUID,
  passage_title TEXT,
  language TEXT NOT NULL,
  wpm INTEGER NOT NULL,
  typed_text TEXT,
  accuracy INTEGER NOT NULL,
  effective_wpm INTEGER,
  grade TEXT,
  word_count INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sessions_uid ON sessions(uid);
CREATE INDEX idx_sessions_created ON sessions(created_at DESC);
CREATE INDEX idx_sessions_uid_wpm_acc ON sessions(uid, wpm, accuracy);

-- LEADERBOARD TABLE
CREATE TABLE leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid UUID UNIQUE NOT NULL,
  name TEXT NOT NULL,
  avatar_initials TEXT DEFAULT '?',
  total_points INTEGER DEFAULT 0,
  weekly_points INTEGER DEFAULT 0,
  best_accuracy INTEGER DEFAULT 0,
  best_wpm INTEGER DEFAULT 0,
  last_active TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leaderboard_weekly ON leaderboard(weekly_points DESC);

-- ENABLE RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE passages ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;

-- USERS RLS POLICIES
CREATE POLICY "users_select_authenticated" ON users FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "users_insert_own" ON users FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

CREATE POLICY "users_update_own" ON users FOR UPDATE
  TO authenticated USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- PASSAGES RLS POLICIES
CREATE POLICY "passages_select_authenticated" ON passages FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "passages_insert_admin" ON passages FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "passages_update_admin" ON passages FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "passages_delete_admin" ON passages FOR DELETE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin')
  );

-- SESSIONS RLS POLICIES
CREATE POLICY "sessions_select_own_or_admin" ON sessions FOR SELECT
  TO authenticated USING (
    auth.uid() = uid OR
    EXISTS (SELECT 1 FROM users WHERE uid = auth.uid() AND role = 'admin')
  );

CREATE POLICY "sessions_insert_own" ON sessions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

-- LEADERBOARD RLS POLICIES
CREATE POLICY "leaderboard_select_authenticated" ON leaderboard FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "leaderboard_insert_own" ON leaderboard FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = uid);

CREATE POLICY "leaderboard_update_own" ON leaderboard FOR UPDATE
  TO authenticated USING (auth.uid() = uid) WITH CHECK (auth.uid() = uid);

-- STORAGE BUCKET FOR AUDIO
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio', 'audio', true)
ON CONFLICT (id) DO NOTHING;