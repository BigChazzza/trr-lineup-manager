'use server'

import { createClient } from '@/lib/supabase/server'
import { getUser } from '@/lib/auth/getSession'
import { getGuildMemberNickname } from '@/lib/discord/bot'
import { getBotConfig } from './bot-config'

/**
 * Syncs the current user's server nickname from Discord
 * Called after login to ensure we have the latest nickname
 */
export async function syncUserNickname() {
  try {
    const user = await getUser()
    if (!user) {
      return { success: false, error: 'Not authenticated' }
    }

    const discord_id = user.user_metadata?.provider_id
    if (!discord_id) {
      return { success: false, error: 'No Discord ID found' }
    }

    // Get bot config to find guild ID
    const configResult = await getBotConfig()
    if (!configResult.success || !configResult.data) {
      // If no bot config, just use the username from auth metadata
      const supabase = await createClient()
      await supabase
        .from('users')
        .update({
          server_nickname: user.user_metadata?.full_name || user.user_metadata?.name,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discord_id)

      return { success: true, nickname: user.user_metadata?.full_name }
    }

    const { guild_id } = configResult.data

    // Fetch guild member data from Discord
    const nicknameResult = await getGuildMemberNickname(guild_id, discord_id)

    if (!nicknameResult.success) {
      console.error('Failed to fetch nickname:', nicknameResult.error)
      // Fallback to username from auth
      const fallbackNickname = user.user_metadata?.full_name || user.user_metadata?.name

      const supabase = await createClient()
      await supabase
        .from('users')
        .update({
          server_nickname: fallbackNickname,
          updated_at: new Date().toISOString()
        })
        .eq('discord_id', discord_id)

      return { success: true, nickname: fallbackNickname }
    }

    // Update user with server nickname
    const supabase = await createClient()
    const { error } = await supabase
      .from('users')
      .update({
        server_nickname: nicknameResult.nickname,
        updated_at: new Date().toISOString()
      })
      .eq('discord_id', discord_id)

    if (error) {
      console.error('Error updating user nickname:', error)
      return { success: false, error: error.message }
    }

    return { success: true, nickname: nicknameResult.nickname }
  } catch (error: unknown) {
    console.error('Error in syncUserNickname:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to sync nickname' }
  }
}
