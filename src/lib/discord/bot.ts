import { REST } from '@discordjs/rest'
import { Routes } from 'discord-api-types/v10'

// Initialize Discord REST client (singleton pattern)
let restClient: REST | null = null

function getDiscordREST() {
  if (!restClient) {
    const token = process.env.DISCORD_BOT_TOKEN
    if (!token) {
      throw new Error('DISCORD_BOT_TOKEN not configured in environment variables')
    }

    restClient = new REST({ version: '10' }).setToken(token)
  }

  return restClient
}

export async function sendDiscordDM(
  discordId: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const rest = getDiscordREST()

    // Create DM channel with user
    const dmChannel = await rest.post(Routes.userChannels(), {
      body: { recipient_id: discordId }
    }) as { id: string }

    // Send message to DM channel
    await rest.post(Routes.channelMessages(dmChannel.id), {
      body: { content: message }
    })

    return { success: true }
  } catch (error: unknown) {
    // Common errors: User has DMs disabled, bot blocked by user, invalid Discord ID
    console.error('Discord DM send error:', error)

    // Extract useful error message from Discord API response
    let errorMessage = 'Unknown error'
    if (typeof error === 'object' && error !== null) {
      const err = error as { code?: number; rawError?: { message?: string }; message?: string }
      if (err.code === 50007) {
        errorMessage = 'Cannot send messages to this user (DMs disabled or bot blocked)'
      } else if (err.code === 10013) {
        errorMessage = 'Unknown user (invalid Discord ID)'
      } else if (err.rawError?.message) {
        errorMessage = err.rawError.message
      } else if (err.message) {
        errorMessage = err.message
      }
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Creates a text channel in a Discord guild under a specific category
 */
export async function createDiscordChannel(
  guildId: string,
  categoryId: string,
  channelName: string
): Promise<{ success: boolean; channelId?: string; error?: string }> {
  try {
    const rest = getDiscordREST()

    const channel = await rest.post(Routes.guildChannels(guildId), {
      body: {
        name: channelName,
        type: 0, // 0 = GUILD_TEXT
        parent_id: categoryId,
      }
    }) as { id: string }

    return { success: true, channelId: channel.id }
  } catch (error: unknown) {
    console.error('Discord channel creation error:', error)

    let errorMessage = 'Unknown error'
    if (typeof error === 'object' && error !== null) {
      const err = error as { message?: string }
      if (err.message) {
        errorMessage = err.message
      }
    }

    return { success: false, error: errorMessage }
  }
}

/**
 * Posts a signup message to a Discord channel with reaction emojis
 */
export async function postSignupMessage(
  channelId: string,
  gameDetails: {
    name: string
    date: string
    time: string
    map?: string
    mode?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const rest = getDiscordREST()

    // Format game details into message
    const messageContent = `
🎮 **${gameDetails.name}**

📅 **Date:** ${gameDetails.date}
⏰ **Time:** ${gameDetails.time}
${gameDetails.map ? `🗺️ **Map:** ${gameDetails.map}\n` : ''}${gameDetails.mode ? `🎯 **Mode:** ${gameDetails.mode}\n` : ''}
**Sign up by reacting with your preferred role:**
⚔️ - Commander
🎖️ - Squad Lead
🔫 - Infantry
🚗 - Armour
🔭 - Recon
    `.trim()

    // Post message
    const message = await rest.post(Routes.channelMessages(channelId), {
      body: { content: messageContent }
    }) as { id: string }

    // Add reactions
    const reactionEmojis = ['⚔️', '🎖️', '🔫', '🚗', '🔭']
    for (const emoji of reactionEmojis) {
      await rest.put(
        Routes.channelMessageOwnReaction(channelId, message.id, encodeURIComponent(emoji))
      )
    }

    return { success: true, messageId: message.id }
  } catch (error: unknown) {
    console.error('Discord message post error:', error)

    let errorMessage = 'Unknown error'
    if (typeof error === 'object' && error !== null) {
      const err = error as { message?: string }
      if (err.message) {
        errorMessage = err.message
      }
    }

    return { success: false, error: errorMessage }
  }
}
