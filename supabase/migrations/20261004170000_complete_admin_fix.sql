-- ============================================================
-- DSA404 Complete Admin Fix Migration
-- Run this ENTIRE block in Supabase → SQL Editor → Run
-- ============================================================

-- 1. Ensure user_feedback table exists with all required columns
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'feedback',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new',
  admin_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ensure user_messages table exists
CREATE TABLE IF NOT EXISTS public.user_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'unread',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create/replace the safe SECURITY DEFINER function
-- This function runs as the DB owner, bypassing RLS on admin_users
-- and preventing infinite recursion in admin policies.
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users WHERE user_id = check_user_id
  );
$$;

-- Grant execute to authenticated users only
REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO service_role;

-- 4. Enable RLS on all relevant tables
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. Drop ALL old policies that may conflict or cause recursion
-- admin_users
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
-- messages
DROP POLICY IF EXISTS "Messages are viewable by everyone" ON public.messages;
DROP POLICY IF EXISTS "Public can view messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
-- admin_notifications
DROP POLICY IF EXISTS "Admins can manage admin_notifications" ON public.admin_notifications;
-- user_feedback
DROP POLICY IF EXISTS "Users can submit feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Users can view their feedback" ON public.user_feedback;
DROP POLICY IF EXISTS "Admins can manage feedback" ON public.user_feedback;
-- user_messages
DROP POLICY IF EXISTS "Users can view their own messages" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can view all user messages" ON public.user_messages;
DROP POLICY IF EXISTS "Admins can manage user messages" ON public.user_messages;
-- profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
-- contests
DROP POLICY IF EXISTS "Admins can manage contests" ON public.contests;

-- 6. Recreate all policies using the safe is_admin_user function

-- admin_users: admins can see who else is admin
CREATE POLICY "Admins can view admin list" ON public.admin_users
  FOR SELECT USING (public.is_admin_user(auth.uid()));

-- messages: everyone can read, admins can write
CREATE POLICY "Public can view messages" ON public.messages
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert messages" ON public.messages
  FOR INSERT WITH CHECK (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can update messages" ON public.messages
  FOR UPDATE USING (public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can delete messages" ON public.messages
  FOR DELETE USING (public.is_admin_user(auth.uid()));

-- admin_notifications: admins only
CREATE POLICY "Admins can manage admin_notifications" ON public.admin_notifications
  FOR ALL USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- user_feedback: users can insert their own, view their own; admins can do everything
CREATE POLICY "Users can submit feedback" ON public.user_feedback
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their feedback" ON public.user_feedback
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin_user(auth.uid()));
CREATE POLICY "Admins can manage feedback" ON public.user_feedback
  FOR ALL USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- user_messages: users see their own, admins see all
CREATE POLICY "Users can view their own messages" ON public.user_messages
  FOR SELECT USING (auth.uid() = recipient_id OR auth.uid() = sender_id);
CREATE POLICY "Admins can manage user messages" ON public.user_messages
  FOR ALL USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- profiles: admins can view all
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin_user(auth.uid()));

-- contests: admins can manage
CREATE POLICY "Admins can manage contests" ON public.contests
  FOR ALL USING (public.is_admin_user(auth.uid()))
  WITH CHECK (public.is_admin_user(auth.uid()));

-- 7. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_feedback_user_id ON public.user_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_user_feedback_category ON public.user_feedback(category);
CREATE INDEX IF NOT EXISTS idx_user_feedback_status ON public.user_feedback(status);
CREATE INDEX IF NOT EXISTS idx_user_feedback_created_at ON public.user_feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_messages_recipient ON public.user_messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_sender ON public.user_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_user_messages_created_at ON public.user_messages(created_at DESC);

-- 8. Updated_at trigger for user_feedback
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_feedback_modtime ON public.user_feedback;
CREATE TRIGGER update_user_feedback_modtime
  BEFORE UPDATE ON public.user_feedback
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

DROP TRIGGER IF EXISTS update_user_messages_modtime ON public.user_messages;
CREATE TRIGGER update_user_messages_modtime
  BEFORE UPDATE ON public.user_messages
  FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 9. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
