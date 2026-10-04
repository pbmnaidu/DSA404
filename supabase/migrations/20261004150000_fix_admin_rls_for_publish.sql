-- Fix for 42501 RLS error on messages table

-- 1. Create a safe SECURITY DEFINER function to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_user(check_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
STABLE
AS $$ 
  -- SECURITY DEFINER runs as the owner (postgres), which bypasses RLS 
  -- on admin_users, preventing recursion.
  SELECT EXISTS (
    SELECT 1 
    FROM public.admin_users 
    WHERE user_id = check_user_id
  );
$$;

-- Ensure anyone authenticated can call it
REVOKE ALL ON FUNCTION public.is_admin_user(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin_user(UUID) TO authenticated;

-- 2. Fix admin_users RLS to not be recursive if it was
DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list" ON public.admin_users
  FOR SELECT
  USING (
    -- Direct check without invoking the function if possible, but
    -- since the function is now safe from recursion via bypassrls (because it's security definer),
    -- we can use the function, OR better yet, just let authenticated users
    -- check if they are in the table. We'll use the function to allow admins to see all.
    public.is_admin_user(auth.uid())
  );

-- 3. Fix messages RLS
DROP POLICY IF EXISTS "Public can view messages" ON public.messages;
CREATE POLICY "Public can view messages" ON public.messages
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Admins can insert messages" ON public.messages;
CREATE POLICY "Admins can insert messages" ON public.messages
  FOR INSERT
  WITH CHECK (
    public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update messages" ON public.messages;
CREATE POLICY "Admins can update messages" ON public.messages
  FOR UPDATE
  USING (
    public.is_admin_user(auth.uid())
  )
  WITH CHECK (
    public.is_admin_user(auth.uid())
  );

DROP POLICY IF EXISTS "Admins can delete messages" ON public.messages;
CREATE POLICY "Admins can delete messages" ON public.messages
  FOR DELETE
  USING (
    public.is_admin_user(auth.uid())
  );
