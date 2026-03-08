import { redirect } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function AdminDashboardPage() {
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  const supabase = await createClient()

  // Get recent games
  const { data: recentGames } = await supabase
    .from('games')
    .select('*, signups(id)')
    .order('created_at', { ascending: false })
    .limit(5)

  // Get total counts
  const { count: totalGames } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })

  const { count: totalPlaybooks } = await supabase
    .from('playbooks')
    .select('*', { count: 'exact', head: true })

  const { count: totalUsers } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage games, playbooks, and lineups</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Games</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{totalGames || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Playbooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{totalPlaybooks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registered Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{totalUsers || 0}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common admin tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/games/admin/create" className="block">
                <Button className="w-full" size="lg">
                  Create New Game
                </Button>
              </Link>
              <Link href="/playbooks/admin/create" className="block">
                <Button variant="outline" className="w-full" size="lg">
                  Create Playbook
                </Button>
              </Link>
              <Link href="/games" className="block">
                <Button variant="outline" className="w-full">
                  View All Games
                </Button>
              </Link>
              <Link href="/playbooks" className="block">
                <Button variant="outline" className="w-full">
                  View All Playbooks
                </Button>
              </Link>
              <Link href="/admin/users" className="block">
                <Button variant="outline" className="w-full">
                  Manage Users
                </Button>
              </Link>
              <Link href="/admin/bot-config" className="block">
                <Button variant="outline" className="w-full">
                  Configure Discord Bot
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Games</CardTitle>
              <CardDescription>Latest created games</CardDescription>
            </CardHeader>
            <CardContent>
              {recentGames && recentGames.length > 0 ? (
                <div className="space-y-3">
                  {recentGames.map((game) => (
                    <Link key={game.id} href={`/games/${game.id}`}>
                      <div className="p-3 border rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-medium">{game.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(game.date), 'MMM d, yyyy')} at {game.time}
                            </p>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            {game.signups?.length || 0} signups
                          </Badge>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No games created yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>System Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">Your Role</p>
                <p>Administrator (Tactician)</p>
              </div>
              <div>
                <p className="font-medium text-muted-foreground">Username</p>
                <p>{user.user_metadata?.full_name || 'Unknown'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
