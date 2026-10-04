-- Keep the database policy aligned with the server-side admin allowlist.
-- This is needed for the configured official admin account even when its
-- auth user id has not yet been inserted into admin_users.
DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Admins can insert messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    public.is_admin_user(auth.uid())
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = '404dsatracker@gmail.com'
  );

DROP POLICY IF EXISTS "Admins can manage admin_notifications" ON public.admin_notifications;
CREATE POLICY "Admins can manage admin_notifications" ON public.admin_notifications
  FOR ALL
  USING (
    public.is_admin_user(auth.uid())
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = '404dsatracker@gmail.com'
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = '404dsatracker@gmail.com'
  );
