import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/roles'
import { createDiscordChannel, postSignupMessage } from '@/lib/discord/bot'
import { getBotConfig } from '@/server-actions/bot-config'

/**
 * Test endpoint to verify Discord integration works
 * Visit: /api/test-discord
 * Only admins can access this
 */
export async function GET() {
  try {
    // Check if user is admin
    await requireAdmin()

    const results: Record<string, unknown> = {}

    // 1. Check if bot token is configured
    results.botTokenConfigured = !!process.env.DISCORD_BOT_TOKEN

    if (!process.env.DISCORD_BOT_TOKEN) {
      return NextResponse.json({
        success: false,
        error: 'DISCORD_BOT_TOKEN not configured in environment variables',
        results
      })
    }

    // 2. Check if bot config exists
    const configResult = await getBotConfig()
    results.configExists = configResult.success
    results.config = configResult.data

    if (!configResult.success || !configResult.data) {
      return NextResponse.json({
        success: false,
        error: 'Bot configuration not found. Please configure at /admin/bot-config',
        results
      })
    }

    const { guild_id, signup_category_id } = configResult.data

    // 3. Try to create a test channel
    const channelName = `test-channel-${Date.now()}`
    const channelResult = await createDiscordChannel(guild_id, signup_category_id, channelName)

    results.channelCreation = {
      success: channelResult.success,
      channelId: channelResult.channelId,
      error: channelResult.error
    }

    if (!channelResult.success) {
      return NextResponse.json({
        success: false,
        error: `Failed to create Discord channel: ${channelResult.error}`,
        results,
        troubleshooting: {
          possibleIssues: [
            'Bot is not in the Discord server',
            'Bot lacks "Manage Channels" permission',
            'Guild ID or Category ID is incorrect',
            'Bot token is invalid'
          ]
        }
      })
    }

    // 4. Try to post a test message
    if (channelResult.channelId) {
      const messageResult = await postSignupMessage(channelResult.channelId, {
        gameId: 'test-game-id',
        name: 'Test Game',
        date: '2024-01-01',
        time: '19:00',
        map: 'Carentan',
        mode: 'Warfare'
      })

      results.messagePosting = {
        success: messageResult.success,
        messageId: messageResult.messageId,
        error: messageResult.error
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Discord integration test completed successfully!',
      results,
      nextSteps: [
        'Check your Discord server for the test channel',
        'If successful, create a real game to test end-to-end',
        'Delete the test channel manually from Discord'
      ]
    })

  } catch (error: unknown) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Make sure you are logged in as an admin'
    }, { status: 500 })
  }
}
