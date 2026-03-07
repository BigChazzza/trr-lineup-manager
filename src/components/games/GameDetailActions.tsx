'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { DeleteConfirmDialog } from '@/components/ui/DeleteConfirmDialog'
import { deleteGame } from '@/server-actions/games'

interface GameDetailActionsProps {
  gameId: string
  gameName: string
  signupCount: number
}

export function GameDetailActions({ gameId, gameName, signupCount }: GameDetailActionsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  return (
    <div className="flex gap-2">
      <Link href={`/games/admin/${gameId}/edit`}>
        <Button variant="outline">Edit Game</Button>
      </Link>
      <Link href={`/games/admin/${gameId}/manage`}>
        <Button variant="outline">Manage Lineup</Button>
      </Link>
      <Button
        variant="destructive"
        onClick={() => setShowDeleteDialog(true)}
      >
        Delete Game
      </Button>

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Game"
        description={`Are you sure you want to delete "${gameName}"? This action cannot be undone.`}
        warningText="Deleting this game will also remove all player signups and squad assignments."
        itemCount={signupCount}
        countLabel="Players who will lose their signups"
        onConfirm={() => deleteGame(gameId)}
        redirectTo="/games"
      />
    </div>
  )
}
