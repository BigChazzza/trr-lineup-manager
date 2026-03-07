'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateUserRole } from '@/server-actions/users'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface User {
  id: string
  username: string
  discord_id: string
  avatar_url: string | null
  discord_roles: string[]
  created_at: string
}

interface UsersListProps {
  users: User[]
}

export function UsersList({ users }: UsersListProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [roleAction, setRoleAction] = useState<{ role: 'Tactician' | 'Admin'; add: boolean } | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)

  const openRoleDialog = (user: User, role: 'Tactician' | 'Admin', add: boolean) => {
    setSelectedUser(user)
    setRoleAction({ role, add })
  }

  const closeDialog = () => {
    setSelectedUser(null)
    setRoleAction(null)
  }

  const handleRoleUpdate = async () => {
    if (!selectedUser || !roleAction) return

    setIsUpdating(true)

    try {
      const result = await updateUserRole(selectedUser.id, roleAction.role, roleAction.add)

      if (result.success) {
        toast({
          title: roleAction.add ? 'Role added' : 'Role removed',
          description: `${roleAction.role} role has been ${roleAction.add ? 'added to' : 'removed from'} ${selectedUser.username}.`,
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update user role',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        variant: 'destructive',
      })
    } finally {
      setIsUpdating(false)
      closeDialog()
    }
  }

  const hasRole = (user: User, role: string) => {
    return user.discord_roles?.includes(role) || false
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Users ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="h-10 w-10 ring-1 ring-gray-300">
                    <AvatarImage
                      src={user.avatar_url || undefined}
                      alt={user.username}
                    />
                    <AvatarFallback className="bg-gray-100 text-foreground">
                      {user.username.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">{user.discord_id}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex gap-2">
                    {hasRole(user, 'Admin') && (
                      <Badge variant="default">Admin</Badge>
                    )}
                    {hasRole(user, 'Tactician') && (
                      <Badge variant="secondary">Tactician</Badge>
                    )}
                    {!hasRole(user, 'Admin') && !hasRole(user, 'Tactician') && (
                      <Badge variant="outline">Member</Badge>
                    )}
                  </div>

                  <Button
                    size="sm"
                    variant={hasRole(user, 'Tactician') ? 'destructive' : 'default'}
                    onClick={() => openRoleDialog(user, 'Tactician', !hasRole(user, 'Tactician'))}
                  >
                    {hasRole(user, 'Tactician') ? 'Remove Tactician' : 'Make Tactician'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {roleAction?.add ? 'Add' : 'Remove'} {roleAction?.role} Role
            </DialogTitle>
            <DialogDescription>
              {roleAction?.add
                ? `Grant ${selectedUser?.username} the ${roleAction.role} role? This will give them admin privileges to create games, manage playbooks, and assign players to lineups.`
                : `Remove the ${roleAction?.role} role from ${selectedUser?.username}? They will lose admin access to create and manage games.`
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleRoleUpdate}
              disabled={isUpdating}
              variant={roleAction?.add ? 'default' : 'destructive'}
            >
              {isUpdating ? 'Updating...' : roleAction?.add ? 'Add Role' : 'Remove Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
