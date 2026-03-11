import Link from 'next/link'
import { redirect } from 'next/navigation'
import { format } from 'date-fns'
import { getGames } from '@/lib/db/games'
import { getUser } from '@/lib/auth/getSession'
import { isAdmin } from '@/lib/auth/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function GamesPage() {
  const user = await getUser()
  if (!user) {
    redirect('/')
  }

  const games = await getGames()
  const userIsAdmin = await isAdmin()

  const openGames = games.filter(g => g.status === 'open')
  const upcomingGames = games.filter(g => g.status === 'draft' || g.status === 'closed')
  const completedGames = games.filter(g => g.status === 'completed')

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Games</h1>
            <p className="text-muted-foreground">Browse and sign up for organized matches</p>
          </div>
          {userIsAdmin && (
            <Link href="/games/admin/create">
              <Button size="lg">Create Game</Button>
            </Link>
          )}
        </div>

        {openGames.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Open for Signups</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {openGames.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <Badge variant="default">Open</Badge>
                      </div>
                      <CardDescription>
                        {game.date && format(new Date(game.date), 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {game.time && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Time:</span> {game.time}
                          </p>
                        )}
                        {game.map && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Map:</span> {game.map}
                          </p>
                        )}
                        {game.mode && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Mode:</span> {game.mode}
                          </p>
                        )}
                        {game.game_size && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Size:</span> {game.game_size}
                          </p>
                        )}
                        {game.playbook && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Playbook:</span> {game.playbook.name}
                          </p>
                        )}
                        {game.strat_maps_link && (
                          <div className="mt-3">
                            <a
                              href={game.strat_maps_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Button variant="outline" size="sm" className="w-full">
                                View Strategy Map
                              </Button>
                            </a>
                          </div>
                        )}
                        <p className="text-muted-foreground text-xs mt-4">
                          Created by {game.created_by_user?.server_nickname || game.created_by_user?.username || 'Unknown'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {upcomingGames.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Upcoming Games</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingGames.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <Badge variant={game.status === 'draft' ? 'secondary' : 'outline'}>
                          {game.status}
                        </Badge>
                      </div>
                      <CardDescription>
                        {game.date && format(new Date(game.date), 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {game.time && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Time:</span> {game.time}
                          </p>
                        )}
                        {game.map && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Map:</span> {game.map}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {completedGames.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Past Games</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedGames.map((game) => (
                <Link key={game.id} href={`/games/${game.id}`}>
                  <Card className="hover:shadow-md transition-all cursor-pointer h-full opacity-75 hover:opacity-100">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-xl">{game.name}</CardTitle>
                        <Badge variant="secondary">Completed</Badge>
                      </div>
                      <CardDescription>
                        {game.date && format(new Date(game.date), 'PPP')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {game.map && (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Map:</span> {game.map}
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {games.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No games scheduled yet.</p>
            {userIsAdmin && (
              <Link href="/games/admin/create">
                <Button>Create First Game</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
