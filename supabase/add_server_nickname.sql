-- Add server_nickname column to users table
-- This stores the Discord server (guild) nickname instead of the global username

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS server_nickname TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_server_nickname ON public.users(server_nickname);

-- Update existing users to use username as fallback
UPDATE public.users
SET server_nickname = username
WHERE server_nickname IS NULL;
