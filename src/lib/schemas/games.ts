import { z } from 'zod'

export const gameSchema = z.object({
  name: z.string().min(1, 'Game name is required').max(100),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  map: z.string().optional(),
  mode: z.string().optional(),
  game_size: z.string().optional(),
  faction: z.string().optional(),
  strat_maps_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  playbook_id: z.string().uuid().optional().nullable(),
  status: z.enum(['draft', 'open', 'closed', 'completed']).default('open'),
  match_result: z.enum(['axis_victory', 'allies_victory', 'draw']).optional(),
  match_score: z.enum(['5-0', '4-1', '3-2']).optional(),
  winning_clan: z.string().max(50, 'Clan name must be 50 characters or less').optional().or(z.literal('')),
  stats_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  stream_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
})

export type GameFormData = z.infer<typeof gameSchema>

// Hell Let Loose maps
export const HLL_MAPS = [
  'Carentan',
  'Driel',
  'Elsenbron',
  'Foy',
  'Hürtgen Forest',
  'Hill 400',
  'Kharkov',
  'Kursk',
  'Omaha Beach',
  'Purple Heart Lane',
  'Remagen',
  'Sainte-Marie-du-Mont',
  'Sainte-Mère-Église',
  'Stalingrad',
  'Utah Beach',
  'El Alamein',
  'Mortain',
] as const

export const HLL_MODES = [
  'Warfare',
  'Offensive',
  'Skirmish',
] as const

export const HLL_GAME_SIZES = [
  '35vs35',
  '40vs40',
  '50vs50',
] as const

export const HLL_FACTIONS = [
  'Axis',
  'Allies',
] as const

export const MATCH_RESULTS = [
  'axis_victory',
  'allies_victory',
  'draw',
] as const

export const MATCH_SCORES = [
  '5-0',
  '4-1',
  '3-2',
] as const
