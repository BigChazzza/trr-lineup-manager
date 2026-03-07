import { redirect } from 'next/navigation'
import { isAdmin } from '@/lib/auth/roles'
import { getUser } from '@/lib/auth/getSession'
import { PlaybookForm } from '@/components/playbooks/PlaybookForm'

export default async function CreatePlaybookPage() {
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Playbook</h1>
          <p className="text-muted-foreground mt-2">
            Define squads, roles, and tasks for your tactical playbook
          </p>
        </div>
        <PlaybookForm />
      </div>
    </div>
  )
}
