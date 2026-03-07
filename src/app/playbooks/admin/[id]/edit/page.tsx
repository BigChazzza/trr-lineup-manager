import { redirect, notFound } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { createClient } from '@/lib/supabase/server'
import { PlaybookForm } from '@/components/playbooks/PlaybookForm'
import type { PlaybookFormData } from '@/lib/schemas/playbooks'

export default async function EditPlaybookPage({
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

  const supabase = await createClient()

  // Fetch the playbook with all nested data
  const { data: playbook, error } = await supabase
    .from('playbooks')
    .select(`
      *,
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

  // Transform database structure to form structure
  const defaultValues: PlaybookFormData = {
    name: playbook.name,
    description: playbook.description || '',
    is_default: playbook.is_default,
    google_doc_link: playbook.google_doc_link || '',
    squads: playbook.squads
      .sort((a, b) => a.squad_order - b.squad_order)
      .map((squad) => ({
        name: squad.name,
        squad_order: squad.squad_order,
        roles: squad.squad_roles
          .sort((a, b) => a.role_order - b.role_order)
          .map((role) => ({
            role_name: role.role_name,
            role_order: role.role_order,
          })),
        tasks: squad.squad_tasks
          .sort((a, b) => a.task_order - b.task_order)
          .map((task) => ({
            task_description: task.task_description,
            task_order: task.task_order,
          })),
      })),
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Edit Playbook</h1>
          <p className="text-muted-foreground mt-2">
            Update squads, roles, and tasks for {playbook.name}
          </p>
        </div>
        <PlaybookForm defaultValues={defaultValues} playbookId={id} />
      </div>
    </div>
  )
}
