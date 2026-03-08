-- Fix RLS policies to allow admins to manage all content
-- This migration adds policies that allow users with 'Admin' or 'Tactician' role to manage content

-- First, create a helper function to check if the current user is an admin
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

-- Helper function to check if user is admin OR tactician
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

-- Users table: Allow admins to update any user
CREATE POLICY "Admins can update any user"
  ON public.users FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Games table: Allow admins to update any game
CREATE POLICY "Admins can update any game"
  ON public.games FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any game"
  ON public.games FOR DELETE
  USING (public.is_admin_or_tactician());

-- Playbooks table: Allow admins to update any playbook
CREATE POLICY "Admins can update any playbook"
  ON public.playbooks FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any playbook"
  ON public.playbooks FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squads table: Allow admins to update any squad
CREATE POLICY "Admins can update any squad"
  ON public.squads FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad"
  ON public.squads FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squad roles: Allow admins to update any squad role
CREATE POLICY "Admins can update any squad role"
  ON public.squad_roles FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad role"
  ON public.squad_roles FOR DELETE
  USING (public.is_admin_or_tactician());

-- Squad tasks: Allow admins to update any squad task
CREATE POLICY "Admins can update any squad task"
  ON public.squad_tasks FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any squad task"
  ON public.squad_tasks FOR DELETE
  USING (public.is_admin_or_tactician());

-- Signups: Allow admins to delete any signup
CREATE POLICY "Admins can delete any signup"
  ON public.signups FOR DELETE
  USING (public.is_admin_or_tactician());

-- Game assignments: Allow admins to update/delete any assignment
CREATE POLICY "Admins can update any assignment"
  ON public.game_assignments FOR UPDATE
  USING (public.is_admin_or_tactician())
  WITH CHECK (public.is_admin_or_tactician());

CREATE POLICY "Admins can delete any assignment"
  ON public.game_assignments FOR DELETE
  USING (public.is_admin_or_tactician());

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Admin permissions have been added successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes made:';
  RAISE NOTICE '- Admins can now update any user (including discord_roles)';
  RAISE NOTICE '- Admins and Tacticians can update/delete games, playbooks, squads, and assignments';
  RAISE NOTICE '';
  RAISE NOTICE 'Note: Existing policies still apply. Policies are combined with OR logic.';
END $$;
