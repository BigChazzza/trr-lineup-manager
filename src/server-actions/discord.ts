'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/roles'
import { sendDiscordDM } from '@/lib/discord/bot'

interface SendResult {
  username: string
  success: boolean
  error?: string
}

export async function sendRoleNotifications(gameId: string) {
  try {
    // Verify user is admin
    await requireAdmin()

    const supabase = await createClient()

    // Fetch game details with playbook squads and tasks
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select(`
        name,
        date,
        time,
        map,
        mode,
        faction,
        playbook:playbooks(
          id,
          name,
          squads(
            id,
            name,
            squad_tasks(task_description, task_order),
            squad_roles(id, role_name)
          )
        )
      `)
      .eq('id', gameId)
      .single()

    if (gameError || !game) {
      console.error('Error fetching game:', gameError)
      return { success: false, error: gameError?.message || 'Game not found' }
    }

    if (!game.playbook) {
      return { success: false, error: 'Game has no playbook assigned' }
    }

    // Fetch all signups
    console.log('Fetching signups for game:', gameId)
    const { data: signups, error: signupsError } = await supabase
      .from('signups')
      .select('*, user:users!signups_user_id_fkey(username, discord_id)')
      .eq('game_id', gameId)

    console.log('Signups query result:', { signupsCount: signups?.length, signupsError })

    if (signupsError) {
      console.error('Error fetching signups:', signupsError)
      return {
        success: false,
        error: `Failed to fetch signups: ${signupsError.message || signupsError.details || JSON.stringify(signupsError)}`
      }
    }

    if (!signups || signups.length === 0) {
      console.error('No signups returned')
      return { success: false, error: 'No players have signed up for this game' }
    }

    // Fetch all game assignments
    console.log('Fetching game assignments for game:', gameId)
    const { data: assignments, error: assignmentsError } = await supabase
      .from('game_assignments')
      .select('id, signup_id, squad_id, role_id')
      .in('signup_id', signups.map(s => s.id))

    console.log('Assignments query result:', { assignmentsCount: assignments?.length, assignmentsError })

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError)
      return {
        success: false,
        error: `Failed to fetch assignments: ${assignmentsError.message || assignmentsError.details || JSON.stringify(assignmentsError)}`
      }
    }

    // Match assignments to signups
    const signupsWithAssignments = signups.map((signup) => {
      const assignment = assignments?.find((a) => a.signup_id === signup.id)
      return {
        ...signup,
        assignment: assignment || null
      }
    })

    // Filter only assigned players
    const assignedPlayers = signupsWithAssignments.filter((s) => s.assignment !== null)

    if (assignedPlayers.length === 0) {
      return { success: false, error: 'No players have been assigned yet. Assign players to squads before sending notifications.' }
    }

    console.log(`Found ${assignedPlayers.length} assigned players, sending DMs...`)

    // Send DMs to each player
    const results: SendResult[] = []

    for (const signup of assignedPlayers) {
      const assignment = signup.assignment

      // Find the squad and role details from the playbook
      // Handle both array and object returns from Supabase
      const playbook = Array.isArray(game.playbook) ? game.playbook[0] : game.playbook
      const squad = playbook?.squads.find((s: { id: string }) => s.id === assignment.squad_id)
      const role = squad?.squad_roles.find((r: { id: string }) => r.id === assignment.role_id)

      if (!squad || !role) {
        results.push({
          username: signup.user.username,
          success: false,
          error: 'Squad or role not found in playbook'
        })
        continue
      }

      // Format tasks
      const tasks = squad.squad_tasks
        .sort((a, b) => a.task_order - b.task_order)
        .map((t, i) => `${i + 1}. ${t.task_description}`)
        .join('\n')

      // Format game details
      const gameDetails = [
        game.map && `Map: ${game.map}`,
        game.mode && `Mode: ${game.mode}`,
        game.faction && `Faction: ${game.faction}`
      ].filter(Boolean).join(' • ')

      const message = `
🎮 **${game.name} - Assignment Notification**

📅 **Date:** ${game.date}
⏰ **Time:** ${game.time}
${gameDetails ? `🗺️ **Details:** ${gameDetails}` : ''}

🎯 **Your Assignment:**
Squad: **${squad.name}**
Role: **${role.role_name}**

📋 **Mission Objectives:**
${tasks || 'No specific objectives assigned'}

Good luck on the battlefield! 🪖
      `.trim()

      console.log(`Sending DM to ${signup.user.username} (Discord ID: ${signup.user.discord_id})`)
      const result = await sendDiscordDM(signup.user.discord_id, message)
      console.log(`Result for ${signup.user.username}:`, result)

      results.push({
        username: signup.user.username,
        success: result.success,
        error: result.error
      })
    }

    const successCount = results.filter(r => r.success).length
    const failedUsers = results.filter(r => !r.success)

    return {
      success: true,
      data: {
        total: results.length,
        succeeded: successCount,
        failed: failedUsers.length,
        failedUsers: failedUsers.map(u => ({ username: u.username, error: u.error }))
      }
    }
  } catch (error: unknown) {
    console.error('Error in sendRoleNotifications:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to send notifications' }
  }
}
