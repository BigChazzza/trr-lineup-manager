import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { getGameById } from '@/lib/db/games'
import { GameForm } from '@/components/games/GameForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { GameFormData } from '@/lib/schemas/games'

export default async function EditGamePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  // Fetch the game
  const game = await getGameById(id)

  if (!game) {
    notFound()
  }

  // Fetch playbooks for selection
  const supabase = await createClient()
  const { data: playbooks } = await supabase
    .from('playbooks')
    .select('id, name')
    .order('name', { ascending: true })

  // Transform game data to form format
  const defaultValues: GameFormData = {
    name: game.name,
    date: game.date,
    time: game.time,
    map: game.map || '',
    mode: game.mode || '',
    game_size: game.game_size || '',
    faction: game.faction || '',
    strat_maps_link: game.strat_maps_link || '',
    playbook_id: game.playbook_id || null,
    status: game.status as 'draft' | 'open' | 'closed' | 'completed',
    match_result: game.match_result as 'axis_victory' | 'allies_victory' | 'draw' | undefined,
    match_score: game.match_score as '5-0' | '4-1' | '3-2' | undefined,
    winning_clan: game.winning_clan || '',
    stats_url: game.stats_url || '',
    stream_link: game.stream_link || '',
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Edit Game</CardTitle>
            <CardDescription>
              Update details for {game.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GameForm
              defaultValues={defaultValues}
              gameId={id}
              playbooks={playbooks || []}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
