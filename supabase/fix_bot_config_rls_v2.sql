-- Comprehensive fix for bot_config RLS policies
-- This addresses upsert permission issues

-- Step 1: Drop ALL existing policies on bot_config
DROP POLICY IF EXISTS "Bot config viewable by admins" ON public.bot_config;
DROP POLICY IF EXISTS "Bot config viewable by admins and tacticians" ON public.bot_config;
DROP POLICY IF EXISTS "Admins can update bot config" ON public.bot_config;
DROP POLICY IF EXISTS "Admins can manage bot config" ON public.bot_config;
DROP POLICY IF EXISTS "Admins can insert bot config" ON public.bot_config;
DROP POLICY IF EXISTS "Admins can delete bot config" ON public.bot_config;

-- Step 2: Verify the is_admin function exists and works
-- Test query (should return true for admin users):
-- SELECT public.is_admin();

-- Step 3: Create new, simpler policies

-- Allow admins to view bot config
CREATE POLICY "admins_select_bot_config"
  ON public.bot_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND discord_roles::jsonb ? 'Admin'
    )
  );

-- Allow admins to insert bot config
CREATE POLICY "admins_insert_bot_config"
  ON public.bot_config
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND discord_roles::jsonb ? 'Admin'
    )
  );

-- Allow admins to update bot config
CREATE POLICY "admins_update_bot_config"
  ON public.bot_config
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND discord_roles::jsonb ? 'Admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND discord_roles::jsonb ? 'Admin'
    )
  );

-- Allow admins to delete bot config
CREATE POLICY "admins_delete_bot_config"
  ON public.bot_config
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id::text = auth.uid()::text
      AND discord_roles::jsonb ? 'Admin'
    )
  );

-- Step 4: Verify RLS is enabled
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- Step 5: Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bot_config TO authenticated;

-- Success message with debugging info
DO $$
BEGIN
  RAISE NOTICE '✅ Bot config RLS policies recreated!';
  RAISE NOTICE '';
  RAISE NOTICE 'Policies created:';
  RAISE NOTICE '- admins_select_bot_config (SELECT)';
  RAISE NOTICE '- admins_insert_bot_config (INSERT)';
  RAISE NOTICE '- admins_update_bot_config (UPDATE)';
  RAISE NOTICE '- admins_delete_bot_config (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE 'To verify your admin status, run:';
  RAISE NOTICE 'SELECT id, username, discord_roles FROM public.users WHERE id::text = auth.uid()::text;';
END $$;
