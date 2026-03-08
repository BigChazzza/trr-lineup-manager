-- Discord Bot Integration Migration
-- Adds bot configuration, Discord channel tracking, and role preferences

-- Bot config table (stores Discord guild/channel settings)
CREATE TABLE IF NOT EXISTS public.bot_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  guild_id TEXT NOT NULL,
  signup_category_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add Discord tracking columns to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS discord_channel_id TEXT,
ADD COLUMN IF NOT EXISTS discord_message_id TEXT;

-- Add role preference column to signups table
ALTER TABLE public.signups
ADD COLUMN IF NOT EXISTS role_preference TEXT
CHECK (role_preference IN ('Commander', 'Squad Lead', 'Infantry', 'Armour', 'Recon'));

-- Add comments
COMMENT ON TABLE public.bot_config IS 'Discord bot configuration settings';
COMMENT ON COLUMN public.bot_config.guild_id IS 'Discord server (guild) ID';
COMMENT ON COLUMN public.bot_config.signup_category_id IS 'Discord category ID where game channels are created';
COMMENT ON COLUMN public.games.discord_channel_id IS 'Discord text channel ID for this game';
COMMENT ON COLUMN public.games.discord_message_id IS 'Discord message ID of signup post';
COMMENT ON COLUMN public.signups.role_preference IS 'Player preferred role from Discord signup (Commander/Squad Lead/Infantry/Armour/Recon)';

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_games_discord_channel ON public.games(discord_channel_id);
CREATE INDEX IF NOT EXISTS idx_games_discord_message ON public.games(discord_message_id);
CREATE INDEX IF NOT EXISTS idx_signups_role_preference ON public.signups(role_preference);

-- Enable RLS on bot_config table
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;

-- RLS policies for bot_config (admin-only access)
CREATE POLICY "Bot config viewable by admins and tacticians"
  ON public.bot_config FOR SELECT
  USING (public.is_admin_or_tactician());

CREATE POLICY "Admins can manage bot config"
  ON public.bot_config FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Trigger for updated_at timestamp
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.bot_config
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Discord integration schema created successfully!';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Deploy the updated Next.js app';
  RAISE NOTICE '2. Configure bot settings at /admin/bot-config';
  RAISE NOTICE '3. Deploy the Discord Gateway listener to Railway/Render';
  RAISE NOTICE '4. Create a game to test channel creation';
END $$;
