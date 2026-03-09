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
    gameId: string
    name: string
    date: string
    time: string
    map?: string
    mode?: string
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const rest = getDiscordREST()

    // Build game link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const gameLink = `${appUrl}/games/${gameDetails.gameId}`

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

**[View Game Details & Lineup](<${gameLink}>)**
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

/**
 * Posts a formatted lineup summary to a Discord channel
 */
export async function postLineupSummary(
  channelId: string,
  lineup: {
    gameName: string
    gameDate: string
    gameTime: string
    map?: string
    mode?: string
    faction?: string
    squads: Array<{
      name: string
      roles: Array<{
        roleName: string
        playerUsername: string | null
      }>
    }>
    unassignedPlayers: string[]
  }
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const rest = getDiscordREST()

    // Format squads
    const squadsList = lineup.squads
      .map((squad) => {
        const rolesList = squad.roles
          .map((role) => `  ${role.roleName}: ${role.playerUsername || '—'}`)
          .join('\n')
        return `**${squad.name}**\n${rolesList}`
      })
      .join('\n\n')

    // Format unassigned players
    const unassignedList = lineup.unassignedPlayers.length > 0
      ? `\n\n**Unassigned Players:**\n${lineup.unassignedPlayers.map(p => `• ${p}`).join('\n')}`
      : ''

    // Game details
    const gameDetails = [
      lineup.map && `Map: ${lineup.map}`,
      lineup.mode && `Mode: ${lineup.mode}`,
      lineup.faction && `Faction: ${lineup.faction}`
    ].filter(Boolean).join(' • ')

    const messageContent = `
📋 **${lineup.gameName} - LINEUP**

📅 **Date:** ${lineup.gameDate}
⏰ **Time:** ${lineup.gameTime}
${gameDetails ? `🗺️ **Details:** ${gameDetails}\n` : ''}
${squadsList}${unassignedList}
    `.trim()

    // Post message
    const message = await rest.post(Routes.channelMessages(channelId), {
      body: { content: messageContent }
    }) as { id: string }

    return { success: true, messageId: message.id }
  } catch (error: unknown) {
    console.error('Discord lineup post error:', error)

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
