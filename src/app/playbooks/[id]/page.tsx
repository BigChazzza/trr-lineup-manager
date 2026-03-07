import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { isAdmin } from '@/lib/auth/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PlaybookDetailActions } from '@/components/playbooks/PlaybookDetailActions'

export default async function PlaybookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const user = await getUser()
  if (!user) {
    redirect('/')
  }

  const userIsAdmin = await isAdmin()
  const supabase = await createClient()

  const { data: playbook, error } = await supabase
    .from('playbooks')
    .select(`
      *,
      created_by_user:users!playbooks_created_by_fkey(username, avatar_url),
      squads(
        id,
        name,
        squad_order,
        squad_roles(id, role_name, role_order),
        squad_tasks(id, task_description, task_order)
      )
    `)
    .eq('id', id)
    .single()

  if (error || !playbook) {
    notFound()
  }

  const sortedSquads = [...playbook.squads].sort((a, b) => a.squad_order - b.squad_order)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link href="/playbooks">
            <Button variant="ghost">← Back to Playbooks</Button>
          </Link>
          {userIsAdmin && (
            <PlaybookDetailActions
              playbookId={playbook.id}
              playbookName={playbook.name}
              squadCount={playbook.squads.length}
            />
          )}
        </div>

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl mb-2">{playbook.name}</CardTitle>
                {playbook.description && (
                  <CardDescription className="text-base">{playbook.description}</CardDescription>
                )}
              </div>
              {playbook.is_default && <Badge variant="default">Default</Badge>}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {playbook.created_by_user && (
              <p className="text-sm text-muted-foreground">
                Created by {playbook.created_by_user.username}
              </p>
            )}
            {playbook.google_doc_link && (
              <a
                href={playbook.google_doc_link}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="outline" className="w-full">
                  View Tactical Guide
                </Button>
              </a>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">Squads ({sortedSquads.length})</h2>

          {sortedSquads.map((squad) => (
            <Card key={squad.id}>
              <CardHeader>
                <CardTitle className="text-xl">{squad.name}</CardTitle>
                {squad.squad_tasks.length > 0 && (
                  <CardDescription>
                    <div className="mt-3">
                      <p className="font-semibold text-xs mb-2">Mission Objectives:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {squad.squad_tasks
                          .sort((a, b) => a.task_order - b.task_order)
                          .map((task) => (
                            <li key={task.id} className="text-sm">
                              {task.task_description}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div>
                  <p className="font-semibold text-xs mb-3">Roles:</p>
                  <div className="flex flex-wrap gap-2">
                    {squad.squad_roles
                      .sort((a, b) => a.role_order - b.role_order)
                      .map((role) => (
                        <Badge key={role.id} variant="secondary">
                          {role.role_name}
                        </Badge>
                      ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sortedSquads.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No squads defined in this playbook.</p>
          )}
        </div>
      </div>
    </div>
  )
}
