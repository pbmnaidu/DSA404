-- ============================================================
-- DSA404 Patch Migration: Fix sync, email, reminders, username login
-- Run this in Supabase → SQL Editor → Run
-- ============================================================

-- ── 1. Fix handle_new_user trigger: update email on conflict ──────────────────
-- Previously ON CONFLICT DO NOTHING meant Google OAuth users had no email
-- in the profiles table, breaking username-based login.
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
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, profiles.email),
    display_name = COALESCE(EXCLUDED.display_name, profiles.display_name),
    photo_url = COALESCE(EXCLUDED.photo_url, profiles.photo_url);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 2. Backfill existing users' emails in profiles ────────────────────────────
-- Fixes username login for users who signed up before the trigger fix.
UPDATE public.profiles p
SET
  email = COALESCE(u.email, p.email),
  display_name = COALESCE(p.display_name, u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name'),
  photo_url = COALESCE(p.photo_url, u.raw_user_meta_data->>'avatar_url', u.raw_user_meta_data->>'picture')
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- ── 3. Add missing columns to user_settings ──────────────────────────────────
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS morning_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS morning_reminder_time TEXT NOT NULL DEFAULT '08:00',
  ADD COLUMN IF NOT EXISTS contest_reminder_enabled BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS start_date TEXT,
  ADD COLUMN IF NOT EXISTS last_active_date TEXT,
  ADD COLUMN IF NOT EXISTS last_morning_reminder_sent_on TEXT;

-- ── 4. Create user_reminders table for cross-device sync ─────────────────────
CREATE TABLE IF NOT EXISTS user_reminders (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  topic TEXT NOT NULL,
  date TEXT NOT NULL,          -- YYYY-MM-DD
  time TEXT NOT NULL,          -- HH:MM
  note TEXT,
  triggered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_reminders_user_id ON user_reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_user_reminders_date ON user_reminders(date);

-- Enable RLS on user_reminders
ALTER TABLE user_reminders ENABLE ROW LEVEL SECURITY;

-- RLS policies: users can only see/modify their own reminders
DROP POLICY IF EXISTS "Users can view own reminders" ON user_reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON user_reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON user_reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON user_reminders;

CREATE POLICY "Users can view own reminders" ON user_reminders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reminders" ON user_reminders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reminders" ON user_reminders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reminders" ON user_reminders FOR DELETE USING (auth.uid() = user_id);

-- Updated_at trigger for user_reminders
CREATE TRIGGER update_user_reminders_modtime
  BEFORE UPDATE ON user_reminders
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- ── 5. Index on profiles.email for faster username lookups ───────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- ── 6. Add username to user_settings (for cron job reference) ────────────────
-- The cron job joins profiles.email by user_id, so no extra column needed.

-- ── 7. Add user_id index on user_settings for cron lookups ───────────────────
CREATE INDEX IF NOT EXISTS idx_user_settings_email_enabled ON user_settings(email_enabled) WHERE email_enabled = true;
CREATE INDEX IF NOT EXISTS idx_user_settings_push_enabled ON user_settings(push_enabled) WHERE push_enabled = true;
