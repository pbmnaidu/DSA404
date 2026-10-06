-- Add new columns for theme customization
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_custom JSONB;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_font TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_font_size TEXT;
ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS theme_force_view TEXT;

-- Enable Realtime for profiles and user_settings to allow live device syncing
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime;
COMMIT;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE user_settings;