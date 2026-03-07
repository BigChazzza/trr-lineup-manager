import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getUser } from '@/lib/auth/getSession'
import { isAdmin } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { UsersList } from '@/components/admin/UsersList'

export default async function UsersAdminPage() {
  const user = await getUser()
  const userIsAdmin = await isAdmin()

  if (!user || !userIsAdmin) {
    redirect('/')
  }

  const supabase = await createClient()

  const { data: users } = await supabase
    .from('users')
    .select('id, username, discord_id, avatar_url, discord_roles, created_at')
    .order('created_at', { ascending: false })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/dashboard">
            <Button variant="ghost">← Back to Dashboard</Button>
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 text-gray-900">User Management</h1>
          <p className="text-muted-foreground">Assign admin roles to players</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">{users?.length || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tacticians</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">
                {users?.filter((u) => u.discord_roles?.includes('Tactician')).length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admins</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-gray-900">
                {users?.filter((u) => u.discord_roles?.includes('Admin')).length || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        <UsersList users={users || []} />
      </div>
    </div>
  )
}
