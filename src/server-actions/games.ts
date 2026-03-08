'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { requireAdmin } from '@/lib/auth/roles'
import { gameSchema, type GameFormData } from '@/lib/schemas/games'
import { revalidatePath } from 'next/cache'
import { createDiscordChannel, postSignupMessage } from '@/lib/discord/bot'
import { getBotConfig } from './bot-config'

export async function createGame(formData: GameFormData) {
  try {
    // Verify user is admin
    await requireAdmin()

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

    // Validate input
    const validatedData = gameSchema.parse(formData)

    // Create game
    const { data, error } = await supabase
      .from('games')
      .insert({
        ...validatedData,
        created_by: userData.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating game:', error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }

    // Try to create Discord channel (non-blocking - don't fail if it errors)
    try {
      const configResult = await getBotConfig()
      if (configResult.success && configResult.data) {
        const { guild_id, signup_category_id } = configResult.data

        // Create channel with sanitized name (Discord allows only lowercase, numbers, and hyphens)
        const channelName = `${data.name.toLowerCase().replace(/[^a-z0-9-]/g, '-')}-${data.id.slice(0, 8)}`
        const channelResult = await createDiscordChannel(guild_id, signup_category_id, channelName)

        if (channelResult.success && channelResult.channelId) {
          // Post signup message
          const messageResult = await postSignupMessage(channelResult.channelId, {
            name: data.name,
            date: data.date,
            time: data.time,
            map: data.map || undefined,
            mode: data.mode || undefined
          })

          // Update game with Discord IDs
          await supabase
            .from('games')
            .update({
              discord_channel_id: channelResult.channelId,
              discord_message_id: messageResult.messageId || null
            })
            .eq('id', data.id)
        }
      }
    } catch (discordError) {
      console.error('Discord channel creation failed (non-fatal):', discordError)
      // Don't return error - game was created successfully
    }

    revalidatePath('/games')
    revalidatePath('/')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error in createGame:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create game' }
  }
}

export async function updateGame(id: string, formData: GameFormData) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Validate input
    const validatedData = gameSchema.parse(formData)

    // Update game
    const { data, error } = await supabase
      .from('games')
      .update(validatedData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating game:', error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }

    revalidatePath('/games')
    revalidatePath(`/games/${id}`)
    revalidatePath('/')

    return { success: true, data }
  } catch (error: unknown) {
    console.error('Error in updateGame:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update game' }
  }
}

export async function deleteGame(id: string) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    const { error } = await supabase
      .from('games')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting game:', error)
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }

    revalidatePath('/games')
    revalidatePath('/')

    return { success: true }
  } catch (error: unknown) {
    console.error('Error in deleteGame:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete game' }
  }
}

export async function saveGameAssignments(
  gameId: string,
  assignments: Record<string, { squadId: string | null; roleId: string | null }>
) {
  try {
    await requireAdmin()

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

    // Track operation counts
    let updated = 0
    let created = 0
    let deleted = 0

    // Process each signup assignment
    for (const [signupId, assignment] of Object.entries(assignments)) {
      // Check if assignment already exists
      const { data: existing } = await supabase
        .from('game_assignments')
        .select('id')
        .eq('game_id', gameId)
        .eq('signup_id', signupId)
        .maybeSingle()

      const hasValidAssignment = assignment.squadId && assignment.roleId

      if (existing && hasValidAssignment) {
        // UPDATE existing assignment
        const { error } = await supabase
          .from('game_assignments')
          .update({
            squad_id: assignment.squadId,
            role_id: assignment.roleId,
            assigned_at: new Date().toISOString(),
            assigned_by: userData.id,
          })
          .eq('id', existing.id)

        if (!error) {
          updated++
        } else {
          console.error('Error updating assignment:', error)
        }
      } else if (existing && !hasValidAssignment) {
        // DELETE assignment (unassigned)
        const { error } = await supabase
          .from('game_assignments')
          .delete()
          .eq('id', existing.id)

        if (!error) {
          deleted++
        } else {
          console.error('Error deleting assignment:', error)
        }
      } else if (!existing && hasValidAssignment) {
        // INSERT new assignment
        const { error } = await supabase
          .from('game_assignments')
          .insert({
            game_id: gameId,
            signup_id: signupId,
            squad_id: assignment.squadId,
            role_id: assignment.roleId,
            assigned_by: userData.id,
          })

        if (!error) {
          created++
        } else {
          console.error('Error creating assignment:', error)
        }
      }
      // If !existing && !hasValidAssignment: do nothing (already unassigned)
    }

    revalidatePath(`/games/admin/${gameId}/manage`)
    revalidatePath(`/games/${gameId}`)

    return { success: true, data: { updated, created, deleted } }
  } catch (error: unknown) {
    console.error('Error in saveGameAssignments:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to save assignments' }
  }
}
