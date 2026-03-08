'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { saveGameAssignments } from '@/server-actions/games'
import { sendRoleNotifications } from '@/server-actions/discord'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Squad {
  id: string
  name: string
  squad_order: number
  squad_roles: Array<{
    id: string
    role_name: string
    role_order: number
  }>
  squad_tasks?: Array<{
    id: string
    task_description: string
    task_order: number
  }>
}

interface Signup {
  id: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  role_preference?: string | null
  assignment?: Array<{
    squad_id: string | null
    role_id: string | null
  }>
}

interface GameDetails {
  name: string
  date: string
  time: string
  map?: string
  mode?: string
  faction?: string
}

interface SendResults {
  succeeded: number
  failed: number
  total: number
  failedUsers: Array<{
    username: string
    error?: string
  }>
}

interface SquadAssignmentProps {
  gameId: string
  squads: Squad[]
  signups: Signup[]
  game: GameDetails
}

export function SquadAssignment({ gameId, squads, signups, game }: SquadAssignmentProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [assignments, setAssignments] = useState<Record<string, { squadId: string; roleId: string }>>(() => {
    // Initialize from existing assignments
    const initial: Record<string, { squadId: string; roleId: string }> = {}
    signups.forEach(signup => {
      if (signup.assignment && signup.assignment.length > 0) {
        const assign = signup.assignment[0]
        if (assign.squad_id && assign.role_id) {
          initial[signup.id] = {
            squadId: assign.squad_id,
            roleId: assign.role_id
          }
        }
      }
    })
    return initial
  })
  const [isSaving, setIsSaving] = useState(false)
  const [isSendingNotifications, setIsSendingNotifications] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [sendResults, setSendResults] = useState<SendResults | null>(null)

  const handleAssign = (signupId: string, squadId: string, roleId: string) => {
    setAssignments(prev => ({
      ...prev,
      [signupId]: { squadId, roleId }
    }))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const result = await saveGameAssignments(gameId, assignments)

      if (result.success && result.data) {
        const { updated, created, deleted } = result.data
        const total = updated + created + deleted

        if (total === 0) {
          toast({
            title: 'No changes',
            description: 'No assignment changes to save',
          })
        } else {
          toast({
            title: 'Assignments saved',
            description: `Updated ${updated}, created ${created}, removed ${deleted}`,
          })
        }
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save assignments',
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSendNotifications = async () => {
    setShowConfirmDialog(false)
    setIsSendingNotifications(true)

    try {
      const result = await sendRoleNotifications(gameId)

      if (result.success && result.data) {
        setSendResults(result.data)
        toast({
          title: 'Notifications sent',
          description: `${result.data.succeeded} of ${result.data.total} messages sent successfully.`,
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to send notifications',
          variant: 'destructive',
        })
      }
    } catch (error: unknown) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send notifications',
        variant: 'destructive',
      })
    } finally {
      setIsSendingNotifications(false)
    }
  }

  const sortedSquads = [...squads].sort((a, b) => a.squad_order - b.squad_order)

  const assignedCount = signups.filter(s => {
    const localAssignment = assignments[s.id]
    const dbAssignment = s.assignment?.[0]

    // Check local state (camelCase) or database state (snake_case)
    return (localAssignment?.squadId && localAssignment?.roleId) ||
           (dbAssignment?.squad_id && dbAssignment?.role_id)
  }).length

  const unassignedCount = signups.filter(s => {
    const localAssignment = assignments[s.id]
    const dbAssignment = s.assignment?.[0]

    // Count as unassigned if NOT fully assigned
    return !(localAssignment?.squadId && localAssignment?.roleId) &&
           !(dbAssignment?.squad_id && dbAssignment?.role_id)
  }).length

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Assign Players to Squads</h2>
        <div className="flex gap-3">
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={isSaving || isSendingNotifications || assignedCount === 0}
            variant="outline"
          >
            {isSendingNotifications ? 'Sending...' : 'Send Roles to Discord'}
          </Button>
          <Button onClick={handleSave} disabled={isSaving || isSendingNotifications}>
            {isSaving ? 'Saving...' : 'Save Assignments'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>
              All Players ({assignedCount} assigned, {unassignedCount} unassigned)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {signups.map((signup) => {
                const assignment = assignments[signup.id] || signup.assignment?.[0]
                // Handle both camelCase (from state) and snake_case (from database)
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const squadId = (assignment as any)?.squadId ?? (assignment as any)?.squad_id
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const roleId = (assignment as any)?.roleId ?? (assignment as any)?.role_id
                const assignedSquad = sortedSquads.find(s => s.id === squadId)
                const assignedRole = assignedSquad?.squad_roles.find(r => r.id === roleId)

                const isAssigned = squadId && roleId

                return (
                  <div key={signup.id} className={`p-3 border rounded-lg ${isAssigned ? 'bg-green-50 border-green-200' : 'bg-white'}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-10 w-10 ring-1 ring-gray-300">
                        <AvatarImage
                          src={signup.user.avatar_url || undefined}
                          alt={signup.user.username}
                        />
                        <AvatarFallback className="bg-gray-100 text-foreground">
                          {signup.user.username.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{signup.user.username}</p>
                          {isAssigned && (
                            <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                              Assigned
                            </Badge>
                          )}
                          {signup.role_preference && (
                            <Badge variant="outline" className="text-xs">
                              Prefers: {signup.role_preference}
                            </Badge>
                          )}
                        </div>
                        {assignedSquad && assignedRole && (
                          <p className="text-xs text-muted-foreground">
                            {assignedSquad.name} - {assignedRole.role_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Select
                        value={assignment?.squadId || ''}
                        onValueChange={(squadId) => {
                          const squad = sortedSquads.find(s => s.id === squadId)
                          if (squad && squad.squad_roles.length > 0) {
                            handleAssign(signup.id, squadId, squad.squad_roles[0].id)
                          }
                        }}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select squad" />
                        </SelectTrigger>
                        <SelectContent>
                          {sortedSquads.map((squad) => (
                            <SelectItem key={squad.id} value={squad.id}>
                              {squad.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {assignment?.squadId && (
                        <Select
                          value={assignment.roleId || ''}
                          onValueChange={(roleId) => {
                            if (assignment.squadId) {
                              handleAssign(signup.id, assignment.squadId, roleId)
                            }
                          }}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            {sortedSquads
                              .find(s => s.id === assignment.squadId)
                              ?.squad_roles.sort((a, b) => a.role_order - b.role_order)
                              .map((role) => (
                                <SelectItem key={role.id} value={role.id}>
                                  {role.role_name}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      )}

                      {assignment?.squadId && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setAssignments(prev => {
                              const newState = { ...prev }
                              delete newState[signup.id]
                              return newState
                            })
                          }}
                        >
                          Unassign
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Squad Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedSquads.map((squad) => {
                const assignedToSquad = signups.filter(
                  s => (assignments[s.id]?.squadId || s.assignment?.[0]?.squad_id) === squad.id
                )

                return (
                  <div key={squad.id} className="p-3 border bg-white rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{squad.name}</h3>
                      <Badge variant="secondary">
                        {assignedToSquad.length}/{squad.squad_roles.length}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-1">
                      {squad.squad_roles
                        .sort((a, b) => a.role_order - b.role_order)
                        .map((role) => {
                          const assignedPlayer = signups.find(
                            s => (assignments[s.id]?.roleId || s.assignment?.[0]?.role_id) === role.id
                          )
                          return (
                            <div key={role.id} className="flex justify-between text-xs">
                              <span className="text-muted-foreground">{role.role_name}</span>
                              <span className="font-medium">
                                {assignedPlayer ? assignedPlayer.user.username : '—'}
                              </span>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Role Notifications?</DialogTitle>
            <DialogDescription>
              This will send Discord DMs to {assignedCount} assigned player(s) with their squad, role, and mission objectives.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-gray-50 border p-4 rounded-lg text-sm">
            <p className="font-semibold mb-2">Message Preview:</p>
            <div className="text-muted-foreground whitespace-pre-line text-xs">
              {(() => {
                // Get first assigned player for preview
                const firstAssigned = signups.find(s => {
                  const localAssignment = assignments[s.id]
                  const dbAssignment = s.assignment?.[0]
                  return (localAssignment?.squadId && localAssignment?.roleId) ||
                         (dbAssignment?.squad_id && dbAssignment?.role_id)
                })

                if (!firstAssigned) {
                  return 'No players assigned yet.'
                }

                const assignment = assignments[firstAssigned.id] || firstAssigned.assignment?.[0]
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const squad = sortedSquads.find(s => s.id === ((assignment as any)?.squadId ?? (assignment as any)?.squad_id))
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const role = squad?.squad_roles.find(r => r.id === ((assignment as any)?.roleId ?? (assignment as any)?.role_id))

                const gameDetails = [
                  game.map && `Map: ${game.map}`,
                  game.mode && `Mode: ${game.mode}`,
                  game.faction && `Faction: ${game.faction}`
                ].filter(Boolean).join(' • ')

                const tasks = squad?.squad_tasks
                  ? squad.squad_tasks
                      .sort((a, b) => a.task_order - b.task_order)
                      .map((t, i) => `${i + 1}. ${t.task_description}`)
                      .join('\n')
                  : 'No specific objectives assigned'

                return `🎮 **${game.name} - Assignment Notification**

📅 **Date:** ${game.date}
⏰ **Time:** ${game.time}
${gameDetails ? `🗺️ **Details:** ${gameDetails}\n` : ''}
🎯 **Your Assignment:**
Squad: **${squad?.name || 'Squad Name'}**
Role: **${role?.role_name || 'Role Name'}**

📋 **Mission Objectives:**
${tasks}

Good luck on the battlefield! 🪖`
              })()}
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              disabled={isSendingNotifications}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNotifications}
              disabled={isSendingNotifications}
            >
              Send DMs
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!sendResults} onOpenChange={(open) => !open && setSendResults(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification Results</DialogTitle>
            <DialogDescription>
              {sendResults?.succeeded} of {sendResults?.total} messages sent successfully
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {sendResults?.succeeded && sendResults.succeeded > 0 && (
              <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                <p className="font-semibold text-green-900 text-sm mb-1">
                  ✅ Successfully sent to {sendResults.succeeded} player(s)
                </p>
              </div>
            )}
            {sendResults?.failed && sendResults.failed > 0 && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <p className="font-semibold text-red-900 text-sm mb-2">
                  ❌ Failed to send to {sendResults.failed} player(s):
                </p>
                <ul className="text-sm text-red-800 space-y-1">
                  {sendResults.failedUsers.map((user, i) => (
                    <li key={i}>
                      • {user.username}: {user.error}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-red-700 mt-3">
                  Common reasons: DMs disabled, bot blocked, or user left server
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSendResults(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
