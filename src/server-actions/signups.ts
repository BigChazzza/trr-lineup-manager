'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { revalidatePath } from 'next/cache'

export async function signUpForGame(gameId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get user's database ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', user.user_metadata?.provider_id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    // Check if already signed up
    const { data: existing } = await supabase
      .from('signups')
      .select('id')
      .eq('game_id', gameId)
      .eq('user_id', userData.id)
      .maybeSingle()

    if (existing) {
      return { success: false, error: 'Already signed up for this game' }
    }

    // Create signup
    const { data, error } = await supabase
      .from('signups')
      .insert({
        game_id: gameId,
        user_id: userData.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating signup:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/games/${gameId}`)
    revalidatePath('/games')
    revalidatePath('/')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error in signUpForGame:', error)
    return { success: false, error: error.message || 'Failed to sign up' }
  }
}

export async function removeSignup(gameId: string) {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const supabase = await createClient()

    // Get user's database ID
    const { data: userData } = await supabase
      .from('users')
      .select('id')
      .eq('discord_id', user.user_metadata?.provider_id)
      .single()

    if (!userData) {
      return { success: false, error: 'User not found' }
    }

    // Delete signup
    const { error } = await supabase
      .from('signups')
      .delete()
      .eq('game_id', gameId)
      .eq('user_id', userData.id)

    if (error) {
      console.error('Error removing signup:', error)
      return { success: false, error: error.message }
    }

    revalidatePath(`/games/${gameId}`)
    revalidatePath('/games')
    revalidatePath('/')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in removeSignup:', error)
    return { success: false, error: error.message || 'Failed to remove signup' }
  }
}
