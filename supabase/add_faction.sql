-- Add faction and game_size columns to games table
-- Run this in Supabase SQL Editor

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS faction text;

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS game_size text;

-- Add comments to document the columns
COMMENT ON COLUMN public.games.faction IS 'Faction for the match: US Forces, German Forces, or Soviet Forces';
COMMENT ON COLUMN public.games.game_size IS 'Game size: 35vs35, 40vs40, or 50vs50';
