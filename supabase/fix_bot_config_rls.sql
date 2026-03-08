-- Fix bot_config RLS policies to allow inserts and updates
-- The previous "FOR ALL" policy doesn't work properly for UPSERT operations

-- Drop the existing policy
DROP POLICY IF EXISTS "Admins can update bot config" ON public.bot_config;

-- Create separate policies for INSERT and UPDATE
CREATE POLICY "Admins can insert bot config"
  ON public.bot_config FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bot config"
  ON public.bot_config FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete bot config"
  ON public.bot_config FOR DELETE
  USING (public.is_admin());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Bot config RLS policies fixed!';
  RAISE NOTICE '';
  RAISE NOTICE 'You should now be able to save bot configuration.';
END $$;
