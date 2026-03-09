'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { requireAdmin } from '@/lib/auth/roles'
import { gameSchema, type GameFormData } from '@/lib/schemas/games'
import { revalidatePath } from 'next/cache'
import { createDiscordChannel, postSignupMessage, postLineupSummary } from '@/lib/discord/bot'
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

export async function postLineupToDiscord(gameId: string) {
  try {
    await requireAdmin()

    const supabase = await createClient()

    // Get game with all details, squads, assignments, and signups
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        id,
        name,
        date,
        time,
        map,
        mode,
        faction,
        discord_channel_id,
        playbook:playbooks(
          id,
          name,
          squads:playbook_squads(
            id,
            name,
            squad_order,
            squad_roles:playbook_squad_roles(
              id,
              role_name,
              role_order
            )
          )
        ),
        signups(
          id,
          user:users!signups_user_id_fkey(id, username),
          assignment:game_assignments(
            squad_id,
            role_id
          )
        )
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      return { success: false, error: 'Game not found' }
    }

    if (!game.discord_channel_id) {
      return { success: false, error: 'This game does not have a Discord channel' }
    }

    if (!game.playbook || !game.playbook.squads || game.playbook.squads.length === 0) {
      return { success: false, error: 'This game does not have a playbook assigned' }
    }

    // Build lineup data structure
    const sortedSquads = [...game.playbook.squads].sort((a, b) => a.squad_order - b.squad_order)

    const squads = sortedSquads.map((squad) => ({
      name: squad.name,
      roles: squad.squad_roles
        .sort((a, b) => a.role_order - b.role_order)
        .map((role) => {
          // Find player assigned to this role
          const assignedSignup = game.signups.find(
            (s) => s.assignment?.[0]?.role_id === role.id
          )
          return {
            roleName: role.role_name,
            playerUsername: assignedSignup?.user.username || null
          }
        })
    }))

    // Get unassigned players
    const unassignedPlayers = game.signups
      .filter((signup) => !signup.assignment || signup.assignment.length === 0 || !signup.assignment[0].squad_id || !signup.assignment[0].role_id)
      .map((signup) => signup.user.username)

    // Post to Discord
    const result = await postLineupSummary(game.discord_channel_id, {
      gameName: game.name,
      gameDate: game.date,
      gameTime: game.time,
      map: game.map || undefined,
      mode: game.mode || undefined,
      faction: game.faction || undefined,
      squads,
      unassignedPlayers
    })

    if (!result.success) {
      return { success: false, error: result.error || 'Failed to post lineup to Discord' }
    }

    return { success: true, messageId: result.messageId }
  } catch (error: unknown) {
    console.error('Error in postLineupToDiscord:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to post lineup' }
  }
}
