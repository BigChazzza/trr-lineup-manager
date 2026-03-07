import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { format } from 'date-fns'
import type { Database } from '@/lib/types'

type Game = Database['public']['Tables']['games']['Row']
type Signup = Database['public']['Tables']['signups']['Row'] & {
  games: Game
}

export default async function Home() {
  const user = await getUser()
  const userIsAdmin = user ? await isAdmin() : false

  let upcomingGames: Game[] = []
  let mySignups: Signup[] = []

  if (user) {
    const supabase = await createClient()

    // Get upcoming games
    const { data: games } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'open')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(3)

    upcomingGames = games || []

    // Get user's signups
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', user.user_metadata?.provider_id)
      .single()

    if (userData) {
      const { data: signups } = await supabase
        .from('signups')
        .select('*, games(*)')
        .eq('user_id', userData.id)
        .limit(3)

      mySignups = signups || []
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-12">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center mb-6">
              <div className="rounded-full border-4 border-pink-500 shadow-lg overflow-hidden w-48 h-48">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover"
                >
                  <source src="https://www.therogueregiment.com/trr-logo-video.mp4" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>
            <h1 className="text-5xl font-bold mb-4 text-gray-900">
              Lineup Manager
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Organize your squad, coordinate your tactics, dominate the battlefield.
            </p>
            {!user && (
              <p className="text-muted-foreground">
                Sign in with Discord to view games and sign up for organized matches.
              </p>
            )}
          </div>

          {user ? (
            <div className="grid md:grid-cols-2 gap-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Upcoming Games</CardTitle>
                  <CardDescription>Open for signups</CardDescription>
                </CardHeader>
                <CardContent>
                  {upcomingGames.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingGames.map((game) => (
                        <Link key={game.id} href={`/games/${game.id}`}>
                          <div className="p-4 border rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
                            <h3 className="font-semibold">{game.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {game.date && format(new Date(game.date), 'PPP')} at {game.time}
                            </p>
                            {game.map && (
                              <p className="text-sm text-muted-foreground">Map: {game.map}</p>
                            )}
                          </div>
                        </Link>
                      ))}
                      <Link href="/games">
                        <Button variant="outline" className="w-full">
                          View All Games
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      No upcoming games yet. Check back soon!
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>My Signups</CardTitle>
                  <CardDescription>Games you&apos;ve signed up for</CardDescription>
                </CardHeader>
                <CardContent>
                  {mySignups.length > 0 ? (
                    <div className="space-y-4">
                      {mySignups.map((signup) => (
                        <Link key={signup.id} href={`/games/${signup.game_id}`}>
                          <div className="p-4 border rounded-lg bg-white hover:bg-gray-50 hover:border-gray-300 transition-all">
                            <h3 className="font-semibold">{signup.games.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {signup.games.date && format(new Date(signup.games.date), 'PPP')}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground mb-4">
                        You haven&apos;t signed up for any games yet.
                      </p>
                      <Link href="/games">
                        <Button>Browse Games</Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 mb-12">
              <Card>
                <CardHeader>
                  <CardTitle>Sign Up</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Register for organized games with just one click.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Get Assigned</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Clan leaders assign you to squads based on tactical playbooks.
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>View Lineup</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    See your squad, role, and objectives before the match.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {userIsAdmin && (
            <Card>
              <CardHeader>
                <CardTitle>Admin Quick Actions</CardTitle>
                <CardDescription>Manage games and playbooks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Link href="/games/admin/create">
                    <Button className="w-full" size="lg">
                      Create New Game
                    </Button>
                  </Link>
                  <Link href="/playbooks/admin/create">
                    <Button variant="outline" className="w-full" size="lg">
                      Create Playbook
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
