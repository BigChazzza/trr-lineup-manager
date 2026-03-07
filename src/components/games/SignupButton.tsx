'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { signUpForGame, removeSignup } from '@/server-actions/signups'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

interface SignupButtonProps {
  gameId: string
  isSignedUp: boolean
  gameStatus: string
}

export function SignupButton({ gameId, isSignedUp, gameStatus }: SignupButtonProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignup = async () => {
    setIsLoading(true)

    try {
      const result = isSignedUp
        ? await removeSignup(gameId)
        : await signUpForGame(gameId)

      if (result.success) {
        toast({
          title: isSignedUp ? 'Signup removed' : 'Signed up successfully',
          description: isSignedUp
            ? 'You have been removed from this game.'
            : 'You are now signed up for this game!',
        })
        router.refresh()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Something went wrong',
          variant: 'destructive',
        })
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update signup',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show button if game is not open for signups
  if (gameStatus !== 'open') {
    return null
  }

  return (
    <Button
      onClick={handleSignup}
      disabled={isLoading}
      variant={isSignedUp ? 'outline' : 'default'}
      size="lg"
    >
      {isLoading ? 'Loading...' : isSignedUp ? 'Remove Signup' : 'Sign Up'}
    </Button>
  )
}
