-- Fix recursive admin policies and guarantee the feedback schema used by the app.
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email text NOT NULL,
  category text NOT NULL DEFAULT 'feedback',
  subject text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_reply text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new';
ALTER TABLE public.user_feedback ADD COLUMN IF NOT EXISTS admin_reply text;
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.admin_users WHERE user_id = auth.uid()); $$;

REVOKE ALL ON FUNCTION public.is_admin_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user() TO authenticated;

DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT USING (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Admins can insert messages" ON public.messages FOR INSERT WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage admin_notifications" ON public.admin_notifications;
CREATE POLICY "Admins can manage admin_notifications" ON public.admin_notifications FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Admins can manage feedback" ON public.user_feedback;
CREATE POLICY "Admins can manage feedback" ON public.user_feedback FOR ALL USING (public.is_admin_user()) WITH CHECK (public.is_admin_user());

DROP POLICY IF EXISTS "Users can submit feedback" ON public.user_feedback;
CREATE POLICY "Users can submit feedback" ON public.user_feedback FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their feedback" ON public.user_feedback;
CREATE POLICY "Users can view their feedback" ON public.user_feedback FOR SELECT USING (auth.uid() = user_id);
