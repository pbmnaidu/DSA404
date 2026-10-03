-- ============================================================
-- DSA404 Migration: Add onboarding_completed to user_settings
-- Run this in Supabase → SQL Editor → Run
-- ============================================================

-- Add onboarding_completed column with default false
ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

-- Backfill: mark users who already have study_days as onboarded
UPDATE user_settings us
SET onboarding_completed = true
WHERE EXISTS (
  SELECT 1 FROM study_days sd WHERE sd.user_id = us.user_id LIMIT 1
);

-- Also mark any user_settings rows that have a start_date (meaning seedPlan ran)
UPDATE user_settings
SET onboarding_completed = true
WHERE start_date IS NOT NULL AND onboarding_completed = false;
