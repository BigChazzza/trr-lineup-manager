-- Verify bot configuration was saved correctly
SELECT
  id,
  guild_id,
  signup_category_id,
  created_at,
  updated_at
FROM public.bot_config;

-- This should show your Guild ID and Category ID
-- If empty, the configuration wasn't saved
-- If populated, the IDs should match your Discord server/category
