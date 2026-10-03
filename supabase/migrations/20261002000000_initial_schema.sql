-- ============================================================
-- DSA404 Full Schema Setup
-- Paste this ENTIRE block into Supabase → SQL Editor → Run
-- ============================================================

-- 0. Safe cleanup (order matters: dependents first)
DROP TABLE IF EXISTS admin_notifications CASCADE;
DROP TABLE IF EXISTS push_subscriptions CASCADE;
DROP TABLE IF EXISTS achievements CASCADE;
DROP TABLE IF EXISTS revision_events CASCADE;
DROP TABLE IF EXISTS study_days CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS admin_users CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TYPE IF EXISTS theme_mode;

-- Drop auth trigger safely (wrapped so it doesn't error)
DO $$ BEGIN
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
DROP FUNCTION IF EXISTS handle_new_user();
DROP FUNCTION IF EXISTS update_modified_column();

-- ============================================================
-- 1. TYPES
-- ============================================================
CREATE TYPE theme_mode AS ENUM ('light', 'dark', 'system');

-- ============================================================
-- 2. TABLES
-- ============================================================

CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    firebase_uid TEXT UNIQUE,
    username TEXT UNIQUE,
    display_name TEXT,
    email TEXT,
    photo_url TEXT,
    banner_url TEXT,
    bio TEXT,
    about_me TEXT,
    notes TEXT,
    linkedin TEXT,
    github TEXT,
    portfolio TEXT,
    social_links JSONB DEFAULT '[]'::jsonb,
    coding_profiles JSONB DEFAULT '{}'::jsonb,
    public_stats JSONB DEFAULT '{"totalSolved": 0, "byPlatform": {}}'::jsonb,
    platform_stats JSONB DEFAULT '{}'::jsonb,
    completed_problems JSONB DEFAULT '[]'::jsonb,
    activity_heatmap JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_users (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    granted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    push_enabled BOOLEAN NOT NULL DEFAULT false,
    email_enabled BOOLEAN NOT NULL DEFAULT false,
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    reminder_time TEXT NOT NULL DEFAULT '08:00',
    paused BOOLEAN NOT NULL DEFAULT false,
    theme theme_mode NOT NULL DEFAULT 'system',
    active_sheet TEXT,
    counts JSONB,
    last_reminder_sent_on TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE study_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    topic TEXT,
    section TEXT,
    subtopics JSONB DEFAULT '[]'::jsonb,
    problems JSONB DEFAULT '[]'::jsonb,
    checklist JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'pending',
    notes TEXT DEFAULT '',
    revision_notes TEXT DEFAULT '',
    level TEXT,
    merge_snapshot JSONB,
    is_revision_day BOOLEAN DEFAULT false,
    revision_day_numbers JSONB,
    day_number INTEGER,
    seq_index INTEGER,
    is_skipped BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE TABLE revision_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    detail TEXT NOT NULL,
    snapshot TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE achievements (
    id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (id, user_id)
);

CREATE TABLE push_subscriptions (
    token TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    device_info TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    url TEXT,
    author UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE contests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    platform TEXT NOT NULL,
    start_ms BIGINT NOT NULL,
    duration_ms BIGINT NOT NULL,
    end_ms BIGINT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_firebase_uid ON profiles(firebase_uid);
CREATE INDEX idx_study_days_user_id ON study_days(user_id);
CREATE INDEX idx_study_days_date ON study_days(date);
CREATE INDEX idx_revision_events_user_id_created ON revision_events(user_id, created_at DESC);
CREATE INDEX idx_contests_end_ms ON contests(end_ms);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- 4. UPDATED_AT TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_settings_modtime BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_study_days_modtime BEFORE UPDATE ON study_days FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_contests_modtime BEFORE UPDATE ON contests FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ============================================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, photo_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(COALESCE(NEW.email,''),'@',1)),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE contests ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- profiles: public read, owner write
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- admin_users
CREATE POLICY "Admins can view admin list" ON admin_users FOR SELECT USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- user_settings: owner only
CREATE POLICY "Users can view own settings" ON user_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON user_settings FOR UPDATE USING (auth.uid() = user_id);

-- study_days: PUBLIC read (needed for profile pages), owner write
CREATE POLICY "Public can view study days" ON study_days FOR SELECT USING (true);
CREATE POLICY "Users can insert own study days" ON study_days FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own study days" ON study_days FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own study days" ON study_days FOR DELETE USING (auth.uid() = user_id);

-- revision_events: owner only
CREATE POLICY "Users can view own revision events" ON revision_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own revision events" ON revision_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own revision events" ON revision_events FOR DELETE USING (auth.uid() = user_id);

-- achievements: public read, owner insert
CREATE POLICY "Achievements are public" ON achievements FOR SELECT USING (true);
CREATE POLICY "Users can insert own achievements" ON achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- push_subscriptions: owner only
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions FOR ALL USING (auth.uid() = user_id);

-- messages: public read
CREATE POLICY "Messages are viewable by everyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Admins can insert messages" ON messages FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- contests: public read
CREATE POLICY "Contests are viewable by everyone" ON contests FOR SELECT USING (true);
CREATE POLICY "Admins can manage contests" ON contests FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- admin_notifications: admins only
CREATE POLICY "Admins can manage admin_notifications" ON admin_notifications FOR ALL USING (EXISTS (SELECT 1 FROM admin_users WHERE user_id = auth.uid()));

-- ============================================================
-- 7. BACKFILL: Create profiles for existing auth users
-- ============================================================
INSERT INTO public.profiles (id, email, display_name, photo_url)
SELECT
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(COALESCE(u.email,''),'@',1)),
    COALESCE(u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture', '')
FROM auth.users u
ON CONFLICT (id) DO NOTHING;
