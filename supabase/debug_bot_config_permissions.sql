-- Debug script to check bot_config permissions
-- Run this to diagnose why you can't save bot configuration

-- 1. Check your current user and roles
SELECT
  id,
  username,
  discord_id,
  discord_roles,
  discord_roles::jsonb ? 'Admin' as has_admin_role,
  discord_roles::jsonb ? 'Tactician' as has_tactician_role
FROM public.users
WHERE id::text = auth.uid()::text;

-- 2. Check if RLS is enabled on bot_config
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'bot_config';

-- 3. List all policies on bot_config
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE tablename = 'bot_config'
ORDER BY policyname;

-- 4. Test if is_admin() function works
SELECT public.is_admin() as am_i_admin;

-- 5. Check table permissions
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'bot_config'
AND table_schema = 'public';

-- Expected results:
-- Query 1: Should show your user with discord_roles containing 'Admin' and has_admin_role = true
-- Query 2: Should show rls_enabled = true
-- Query 3: Should show 4 policies (select, insert, update, delete)
-- Query 4: Should return true if you're an admin
-- Query 5: Should show authenticated role has INSERT, SELECT, UPDATE, DELETE privileges
