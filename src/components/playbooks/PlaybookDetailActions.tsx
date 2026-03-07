'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { deletePlaybook } from '@/server-actions/playbooks'

interface PlaybookDetailActionsProps {
  playbookId: string
  playbookName: string
  squadCount: number
}

export function PlaybookDetailActions({
  playbookId,
  playbookName,
  squadCount,
}: PlaybookDetailActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <div className="flex gap-2">
      <Link href={`/playbooks/admin/${playbookId}/edit`}>
        <Button variant="outline">Edit Playbook</Button>
      </Link>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        Delete Playbook
      </Button>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Playbook"
        description={`Are you sure you want to delete "${playbookName}"? This action cannot be undone.`}
        warningText="Deleting this playbook will permanently remove all squads, roles, and tasks. Games using this playbook will remain but their playbook reference will be cleared."
        itemCount={squadCount}
        countLabel="Squads to be deleted"
        onConfirm={() => deletePlaybook(playbookId)}
        redirectTo="/playbooks"
      />
    </div>
  )
}
