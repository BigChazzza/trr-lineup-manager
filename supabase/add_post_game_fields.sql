-- Add post-game statistics fields to games table
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS match_result TEXT CHECK (match_result IN ('axis_victory', 'allies_victory', 'draw')),
ADD COLUMN IF NOT EXISTS match_score TEXT CHECK (match_score IN ('5-0', '4-1', '3-2')),
ADD COLUMN IF NOT EXISTS winning_clan TEXT,
ADD COLUMN IF NOT EXISTS stats_url TEXT,
ADD COLUMN IF NOT EXISTS stream_link TEXT;

-- Add comments explaining the fields
COMMENT ON COLUMN public.games.match_result IS 'Result of the match: axis_victory, allies_victory, or draw';
COMMENT ON COLUMN public.games.match_score IS 'Final score: 5-0, 4-1, or 3-2 (Hell Let Loose scoring)';
COMMENT ON COLUMN public.games.winning_clan IS 'Name of the winning clan/team (e.g., TRR, DIXX)';
COMMENT ON COLUMN public.games.stats_url IS 'URL to external match statistics or scoreboard';
COMMENT ON COLUMN public.games.stream_link IS 'URL to stream VOD or recording';
