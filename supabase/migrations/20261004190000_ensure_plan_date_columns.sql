-- Keep plan scheduling usable on databases created before plan dates existed.
ALTER TABLE public.user_settings
  ADD COLUMN IF NOT EXISTS start_date TEXT,
  ADD COLUMN IF NOT EXISTS last_active_date TEXT;
