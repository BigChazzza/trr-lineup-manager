import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { getGameById } from '@/lib/db/games'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { SquadAssignment } from '@/components/games/SquadAssignment'

export default async function ManageGamePage({
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

  const game = await getGameById(id)

  if (!game) {
    notFound()
  }

  const sortedSquads = game.playbook?.squads
    ? [...game.playbook.squads]
        .sort((a, b) => a.squad_order - b.squad_order)
        .map((squad) => ({
          ...squad,
          squad_tasks: squad.squad_tasks || []
        }))
    : []

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href={`/games/${id}`}>
            <Button variant="ghost">← Back to Game</Button>
          </Link>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Manage Lineup - {game.name}</CardTitle>
            <CardDescription>
              {game.date} at {game.time} • {game.signups.length} player(s) signed up
            </CardDescription>
          </CardHeader>
        </Card>

        {game.playbook && sortedSquads.length > 0 ? (
          <SquadAssignment
            gameId={game.id}
            squads={sortedSquads}
            signups={game.signups}
            game={{
              name: game.name,
              date: game.date,
              time: game.time,
              map: game.map,
              mode: game.mode,
              faction: game.faction
            }}
          />
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground mb-4">
                No playbook assigned to this game yet.
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                Edit the game and select a playbook to enable squad assignments.
              </p>
              <div className="bg-gray-50 border p-4 rounded-lg text-left max-w-2xl mx-auto">
                <p className="font-semibold text-xs mb-2">Current Signups ({game.signups.length}):</p>
                <ul className="list-disc list-inside space-y-1">
                  {game.signups.map((signup) => (
                    <li key={signup.id} className="text-sm">
                      {signup.user.username}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
