import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { getGameById } from '@/lib/db/games'
import { getUser } from '@/lib/auth/getSession'
import { isAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SignupButton } from '@/components/games/SignupButton'
import { LineupView } from '@/components/games/LineupView'
import { PlayerAssignmentModal } from '@/components/games/PlayerAssignmentModal'
import { GameDetailActions } from '@/components/games/GameDetailActions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await getUser()
  if (!user) {
    redirect('/')
  }

  const game = await getGameById(id)

  if (!game) {
    notFound()
  }

  const userIsAdmin = await isAdmin()

  const supabase = await createClient()
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('discord_id', user.user_metadata?.provider_id)
    .single()

  let currentUserDbId: string | null = null
  let isSignedUp = false

  if (userData) {
    currentUserDbId = userData.id
    isSignedUp = game.signups.some((s) => s.user_id === userData.id)
  }

  const sortedSquads = game.playbook?.squads
    ? [...game.playbook.squads].sort((a, b) => a.squad_order - b.squad_order)
    : []

  // Check if current user has an assignment
  let userSquad = null
  let userRole = null
  if (currentUserDbId && isSignedUp) {
    const userSignup = game.signups.find((s) => s.user_id === currentUserDbId)
    if (userSignup?.assignment && userSignup.assignment.length > 0) {
      const assignment = userSignup.assignment[0]
      userSquad = sortedSquads.find((s) => s.id === assignment.squad_id)
      userRole = userSquad?.squad_roles?.find((r) => r.id === assignment.role_id)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/games">
            <Button variant="ghost">← Back to Games</Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{game.name}</CardTitle>
                    <CardDescription className="text-lg">
                      {format(new Date(game.date), 'EEEE, MMMM d, yyyy')} at {game.time}
                    </CardDescription>
                  </div>
                  <Badge
                    variant={
                      game.status === 'open'
                        ? 'default'
                        : game.status === 'completed'
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {game.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {game.map && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Map</p>
                      <p className="text-lg font-semibold">{game.map}</p>
                    </div>
                  )}
                  {game.mode && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Game Mode</p>
                      <p className="text-lg font-semibold">{game.mode}</p>
                    </div>
                  )}
                  {game.game_size && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Game Size</p>
                      <p className="text-lg font-semibold">{game.game_size}</p>
                    </div>
                  )}
                  {game.faction && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Faction</p>
                      <p className="text-lg font-semibold">{game.faction}</p>
                    </div>
                  )}
                </div>

                {game.playbook && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Playbook</p>
                    <p className="text-lg font-semibold">{game.playbook.name}</p>
                    {game.playbook.description && (
                      <p className="text-sm text-muted-foreground mt-1">{game.playbook.description}</p>
                    )}
                  </div>
                )}

                {game.strat_maps_link && (
                  <div className="pt-4">
                    <a
                      href={game.strat_maps_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" className="w-full">
                        View Strategy Map
                      </Button>
                    </a>
                  </div>
                )}

                {/* Post-Game Statistics */}
                {game.status === 'completed' && (game.match_result || game.winning_clan || game.stats_url || game.stream_link) && (
                  <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-semibold mb-3">Match Results</h3>

                    {game.match_result && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Result: </span>
                        <Badge variant={
                          game.match_result === 'axis_victory' ? 'default' :
                          game.match_result === 'allies_victory' ? 'default' :
                          'secondary'
                        }>
                          {game.match_result === 'axis_victory' ? 'Axis Victory' :
                           game.match_result === 'allies_victory' ? 'Allies Victory' :
                           'Draw'}
                        </Badge>
                        {game.match_score && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            ({game.match_score})
                          </span>
                        )}
                      </div>
                    )}

                    {game.winning_clan && (
                      <div className="mb-2">
                        <span className="text-sm font-medium">Winner: </span>
                        <span className="text-sm font-semibold text-foreground">
                          {game.winning_clan}
                        </span>
                      </div>
                    )}

                    {(game.stats_url || game.stream_link) && (
                      <div className="flex gap-2 mt-3">
                        {game.stats_url && (
                          <a
                            href={game.stats_url}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              View Match Stats
                            </Button>
                          </a>
                        )}
                        {game.stream_link && (
                          <a
                            href={game.stream_link}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              Watch VOD
                            </Button>
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <SignupButton
                    gameId={game.id}
                    isSignedUp={isSignedUp}
                    gameStatus={game.status}
                  />
                  {userSquad && userRole && (
                    <PlayerAssignmentModal squad={userSquad} role={userRole} />
                  )}
                  {userIsAdmin && (
                    <GameDetailActions
                      gameId={game.id}
                      gameName={game.name}
                      signupCount={game.signups.length}
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            <div>
              <h2 className="text-2xl font-bold mb-4 text-gray-900">Squad Lineup</h2>
              <LineupView
                squads={sortedSquads}
                signups={game.signups}
                currentUserId={currentUserDbId}
              />
            </div>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Signed Up ({game.signups.length})</CardTitle>
                <CardDescription>Players registered for this game</CardDescription>
              </CardHeader>
              <CardContent>
                {game.signups.length > 0 ? (
                  <div className="space-y-3">
                    {game.signups.map((signup) => (
                      <div key={signup.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors">
                        <Avatar className="h-10 w-10 ring-1 ring-gray-300">
                          <AvatarImage
                            src={signup.user.avatar_url || undefined}
                            alt={signup.user.username}
                          />
                          <AvatarFallback className="bg-gray-100 text-foreground">
                            {signup.user.username.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{signup.user.username}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(signup.signed_up_at), 'MMM d, h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No signups yet. Be the first!
                  </p>
                )}
              </CardContent>
            </Card>

            {game.created_by_user && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Created By</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <Avatar className="ring-1 ring-gray-300">
                      <AvatarImage
                        src={game.created_by_user.avatar_url || undefined}
                        alt={game.created_by_user.username}
                      />
                      <AvatarFallback className="bg-gray-100 text-foreground">
                        {game.created_by_user.username.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium">{game.created_by_user.username}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
