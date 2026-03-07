import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Squad {
  id: string
  name: string
  squad_order: number
  squad_roles: Array<{
    id: string
    role_name: string
    role_order: number
  }>
  squad_tasks: Array<{
    id: string
    task_description: string
    task_order: number
  }>
}

interface Signup {
  id: string
  user_id: string
  user: {
    id: string
    username: string
    avatar_url: string | null
  }
  assignment?: Array<{
    squad_id: string | null
    role_id: string | null
  }>
}

interface LineupViewProps {
  squads: Squad[]
  signups: Signup[]
  currentUserId?: string | null
}

export function LineupView({ squads, signups, currentUserId }: LineupViewProps) {
  // Create a map of assignments
  const assignmentMap = new Map<string, { squadId: string; roleId: string; user: Signup['user'] }>()

  signups.forEach((signup) => {
    if (signup.assignment && signup.assignment.length > 0) {
      const assignment = signup.assignment[0]
      if (assignment.squad_id && assignment.role_id) {
        const key = `${assignment.squad_id}-${assignment.role_id}`
        assignmentMap.set(key, {
          squadId: assignment.squad_id,
          roleId: assignment.role_id,
          user: signup.user,
        })
      }
    }
  })

  if (squads.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            No lineup configured yet. Apply a playbook or wait for an admin to set up the squads.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {squads
        .sort((a, b) => a.squad_order - b.squad_order)
        .map((squad) => {
          // Check if current user is in this squad
          const isUserSquad = signups.some(
            (signup) =>
              signup.user_id === currentUserId &&
              signup.assignment?.[0]?.squad_id === squad.id
          )

          return (
            <Card key={squad.id} className={isUserSquad ? 'border-2 border-gray-400' : ''}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">{squad.name}</CardTitle>
                  {isUserSquad && <Badge variant="default">Your Squad</Badge>}
                </div>
                {squad.squad_tasks.length > 0 && (
                  <CardDescription>
                    <div className="mt-3">
                      <p className="font-semibold text-xs mb-2">Mission Objectives:</p>
                      <ul className="list-disc list-inside space-y-1">
                        {squad.squad_tasks
                          .sort((a, b) => a.task_order - b.task_order)
                          .map((task) => (
                            <li key={task.id} className="text-sm text-muted-foreground">
                              {task.task_description}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {squad.squad_roles
                    .sort((a, b) => a.role_order - b.role_order)
                    .map((role) => {
                      const assignment = assignmentMap.get(`${squad.id}-${role.id}`)
                      const isUserRole =
                        assignment?.user.id === currentUserId

                      return (
                        <div
                          key={role.id}
                          className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                            isUserRole
                              ? 'bg-blue-50 border-blue-400 shadow-md'
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="font-medium text-sm min-w-[150px]">{role.role_name}</div>
                            {assignment ? (
                              <div className="flex items-center gap-2">
                                <Avatar className="h-8 w-8 ring-1 ring-gray-300">
                                  <AvatarImage
                                    src={assignment.user.avatar_url || undefined}
                                    alt={assignment.user.username}
                                  />
                                  <AvatarFallback className="bg-gray-100 text-foreground">
                                    {assignment.user.username.slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm">{assignment.user.username}</span>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground italic">Unassigned</span>
                            )}
                          </div>
                          {isUserRole && (
                            <Badge variant="default" className="ml-2">
                              You
                            </Badge>
                          )}
                        </div>
                      )
                    })}
                </div>
              </CardContent>
            </Card>
          )
        })}
    </div>
  )
}
