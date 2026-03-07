-- Add game_size column to games table
-- Run this in Supabase SQL Editor to add game size support

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS game_size text;

-- Add a comment to document the column
COMMENT ON COLUMN public.games.game_size IS 'Game size: 35vs35, 40vs40, or 50vs50';
