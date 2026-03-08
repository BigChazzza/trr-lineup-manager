-- Bootstrap script to add the first Admin user
-- Use this ONLY to create your first admin, then use the app UI for other users

-- Step 1: Find your user ID
-- First, log into the app and check the URL or console to find your discord_id
-- Or run: SELECT id, discord_id, username FROM public.users;

-- Step 2: Update YOUR user to have Admin role
-- Replace 'YOUR_DISCORD_ID' with your actual Discord ID from step 1
UPDATE public.users
SET discord_roles = '["Admin"]'::jsonb
WHERE discord_id = 'YOUR_DISCORD_ID';

-- Step 3: Verify the change
SELECT
  id,
  username,
  discord_id,
  discord_roles,
  discord_roles::jsonb ? 'Admin' as has_admin_role
FROM public.users
WHERE discord_id = 'YOUR_DISCORD_ID';

-- IMPORTANT: After running this:
-- 1. Log out of the application
-- 2. Log back in (this refreshes your session and RLS policies)
-- 3. You should now see the Admin menu
-- 4. Use the Admin UI to add other Tacticians/Admins
