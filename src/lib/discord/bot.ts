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
