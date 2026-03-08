-- Comprehensive fix for admin permissions
-- This version drops conflicting policies and recreates them properly

-- Step 1: Create/Update helper functions
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text
    AND discord_roles::jsonb ? 'Admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_admin_or_tactician()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id::text = auth.uid()::text
    AND (discord_roles::jsonb ? 'Admin' OR discord_roles::jsonb ? 'Tactician')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 2: Drop existing admin policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Admins can update any user" ON public.users;
DROP POLICY IF EXISTS "Admins can update any game" ON public.games;
DROP POLICY IF EXISTS "Admins can delete any game" ON public.games;
DROP POLICY IF EXISTS "Admins can update any playbook" ON public.playbooks;
DROP POLICY IF EXISTS "Admins can delete any playbook" ON public.playbooks;
DROP POLICY IF EXISTS "Admins can update any squad" ON public.squads;
DROP POLICY IF EXISTS "Admins can delete any squad" ON public.squads;
DROP POLICY IF EXISTS "Admins can update any squad role" ON public.squad_roles;
DROP POLICY IF EXISTS "Admins can delete any squad role" ON public.squad_roles;
DROP POLICY IF EXISTS "Admins can update any squad task" ON public.squad_tasks;
DROP POLICY IF EXISTS "Admins can delete any squad task" ON public.squad_tasks;
DROP POLICY IF EXISTS "Admins can delete any signup" ON public.signups;
DROP POLICY IF EXISTS "Admins can update any assignment" ON public.game_assignments;
DROP POLICY IF EXISTS "Admins can delete any assignment" ON public.game_assignments;

-- Step 3: Create new admin policies
-- Users table: Allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Games table: Allow admins/tacticians to manage games
CREATE POLICY "Admins can update any game"
  ON public.games FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any game"
  ON public.games FOR DELETE
  USING (public.is_admin_or_tactician());

-- Playbooks table: Allow admins/tacticians to manage playbooks
CREATE POLICY "Admins can update any playbook"
  ON public.playbooks FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any playbook"
  ON public.playbooks FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squads table: Allow admins/tacticians to manage squads
CREATE POLICY "Admins can update any squad"
  ON public.squads FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad"
  ON public.squads FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squad roles: Allow admins/tacticians to manage squad roles
CREATE POLICY "Admins can update any squad role"
  ON public.squad_roles FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad role"
  ON public.squad_roles FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squad tasks: Allow admins/tacticians to manage squad tasks
CREATE POLICY "Admins can update any squad task"
  ON public.squad_tasks FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad task"
  ON public.squad_tasks FOR DELETE
  USING (public.is_admin_or_tactician());

-- Signups: Allow admins/tacticians to delete signups
CREATE POLICY "Admins can delete any signup"
  ON public.signups FOR DELETE
  USING (public.is_admin_or_tactician());

-- Game assignments: Allow admins/tacticians to manage assignments
CREATE POLICY "Admins can update any assignment"
  ON public.game_assignments FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any assignment"
  ON public.game_assignments FOR DELETE
  USING (public.is_admin_or_tactician());

-- Step 4: Verify the changes
DO $$
BEGIN
  RAISE NOTICE '✅ Admin permissions have been updated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Log out and log back in to refresh your session';
  RAISE NOTICE '2. Run debug_permissions.sql to verify your admin status';
  RAISE NOTICE '3. Try updating a user role again';
END $$;
