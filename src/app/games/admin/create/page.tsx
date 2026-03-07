import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { GameForm } from '@/components/games/GameForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function CreateGamePage() {
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  // Fetch playbooks for selection
  const supabase = await createClient()
  const { data: playbooks } = await supabase
    .from('playbooks')
    .select('id, name')
    .order('name', { ascending: true })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Create New Game</CardTitle>
            <CardDescription>
              Set up a new organized game for The Rogue Regiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <GameForm playbooks={playbooks || []} />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
