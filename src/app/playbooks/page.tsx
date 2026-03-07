import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { isAdmin } from '@/lib/auth/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export default async function PlaybooksPage() {
  const user = await getUser()
  if (!user) {
    redirect('/')
  }

  const userIsAdmin = await isAdmin()
  const supabase = await createClient()

  const { data: playbooks } = await supabase
    .from('playbooks')
    .select(`
      *,
      created_by_user:users!playbooks_created_by_fkey(username),
      squads(id)
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 text-gray-900">Playbooks</h1>
            <p className="text-muted-foreground">Tactical templates for organizing your squads</p>
          </div>
          {userIsAdmin && (
            <Link href="/playbooks/admin/create">
              <Button size="lg">Create Playbook</Button>
            </Link>
          )}
        </div>

        {playbooks && playbooks.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {playbooks.map((playbook) => (
              <Link key={playbook.id} href={`/playbooks/${playbook.id}`}>
                <Card className="hover:shadow-md hover:border-gray-300 transition-all cursor-pointer h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-xl">{playbook.name}</CardTitle>
                      {playbook.is_default && <Badge>Default</Badge>}
                    </div>
                    {playbook.description && (
                      <CardDescription className="line-clamp-2">
                        {playbook.description}
                      </CardDescription>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      <p>{playbook.squads?.length || 0} squad(s)</p>
                      {playbook.created_by_user && (
                        <p className="text-xs text-muted-foreground mt-2">
                          By {playbook.created_by_user.username}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No playbooks created yet.</p>
            {userIsAdmin && (
              <Link href="/playbooks/admin/create">
                <Button>Create First Playbook</Button>
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
