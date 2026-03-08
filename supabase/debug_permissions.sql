-- Debug script to check if admin permissions are working
-- Run this in Supabase SQL Editor to diagnose the issue

-- 1. Check if the helper functions exist
SELECT
  proname as function_name,
  prosrc as function_body
FROM pg_proc
WHERE proname IN ('is_admin', 'is_admin_or_tactician')
  AND pronamespace = 'public'::regnamespace;

-- 2. List all policies on the users table
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;

-- 3. Check your current user's roles
-- Replace 'YOUR_USER_ID' with your actual auth.users.id
-- You can find it by running: SELECT auth.uid();
SELECT
  id,
  discord_id,
  username,
  discord_roles
FROM public.users
WHERE id::text = auth.uid()::text;

-- 4. Test if the is_admin() function works for your user
SELECT
  auth.uid() as current_user_id,
  public.is_admin() as am_i_admin,
  public.is_admin_or_tactician() as am_i_admin_or_tactician;

-- 5. Show all users with Admin or Tactician roles
SELECT
  username,
  discord_id,
  discord_roles,
  discord_roles::jsonb ? 'Admin' as has_admin,
  discord_roles::jsonb ? 'Tactician' as has_tactician
FROM public.users
WHERE discord_roles::jsonb ? 'Admin' OR discord_roles::jsonb ? 'Tactician';
