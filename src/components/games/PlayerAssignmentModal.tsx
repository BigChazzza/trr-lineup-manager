'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface PlayerAssignmentModalProps {
  squad: {
    name: string
    squad_tasks: Array<{
      id: string
      task_description: string
      task_order: number
    }>
  }
  role: {
    role_name: string
  }
}

export function PlayerAssignmentModal({ squad, role }: PlayerAssignmentModalProps) {
  const sortedTasks = [...squad.squad_tasks].sort((a, b) => a.task_order - b.task_order)

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="default">What am I doing?</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Your Assignment</DialogTitle>
          <DialogDescription>
            Here's your squad assignment and objectives for this game
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">Squad Assignment</p>
            <Badge variant="default" className="text-base px-3 py-1">
              {squad.name}
            </Badge>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Role</p>
            <Badge variant="secondary" className="text-base px-3 py-1">
              {role.role_name}
            </Badge>
          </div>

          {sortedTasks.length > 0 && (
            <div>
              <p className="text-xs text-muted-foreground mb-2">Objectives</p>
              <ul className="list-disc list-inside space-y-2 bg-gray-50 border p-4 rounded-lg">
                {sortedTasks.map((task) => (
                  <li key={task.id} className="text-sm text-foreground">
                    {task.task_description}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {sortedTasks.length === 0 && (
            <div className="text-sm text-muted-foreground italic">
              No specific objectives assigned to this squad yet.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
