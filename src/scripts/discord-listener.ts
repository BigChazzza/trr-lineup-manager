import { Client, GatewayIntentBits, Partials, Message } from 'discord.js'
import { createClient } from '@supabase/supabase-js'

// Emoji to role mapping
const ROLE_MAP: Record<string, string> = {
  '⚔️': 'Commander',
  '🎖️': 'Squad Lead',
  '🔫': 'Infantry',
  '🚗': 'Armour',
  '🔭': 'Recon'
}

// Initialize Discord client with required intents and partials
// Partials are CRITICAL for detecting reactions on messages that aren't in cache
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessageReactions,
  ],
  partials: [
    Partials.Message,      // Required to receive events for uncached messages
    Partials.Channel,      // Required if message is in uncached channel
    Partials.Reaction,     // Required to receive reaction events for uncached messages
  ],
})

// Initialize Supabase client (needs service role key to bypass RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper function to update signup message with signed up users
async function updateSignupMessage(message: Message) {
  try {
    // Fetch full message if partial
    if (message.partial) {
      await message.fetch()
    }

    // Get game from message ID
    const { data: game } = await supabase
      .from('games')
      .select('id, name, date, time, map, mode')
      .eq('discord_message_id', message.id)
      .single()

    if (!game) return

    // Get all signups for this game
    const { data: signups } = await supabase
      .from('signups')
      .select('user_id, role_preference, user:users!signups_user_id_fkey(server_nickname, username, discord_id)')
      .eq('game_id', game.id)

    // Group signups by role
    const signupsByRole: Record<string, string[]> = {}
    for (const emoji of Object.keys(ROLE_MAP)) {
      signupsByRole[emoji] = []
    }

    if (signups) {
      for (const signup of signups) {
        const roleEmoji = Object.keys(ROLE_MAP).find(emoji => ROLE_MAP[emoji] === signup.role_preference)
        if (roleEmoji && signup.user) {
          // Type assertion needed due to Supabase type inference
          const user = signup.user as unknown as { server_nickname?: string | null; username: string; discord_id: string }
          const displayName = user.server_nickname || user.username
          signupsByRole[roleEmoji].push(displayName)
        }
      }
    }

    // Build message with signups
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const gameLink = `${appUrl}/games/${game.id}`

    let messageContent = `
🎮 **${game.name}**

📅 **Date:** ${game.date}
⏰ **Time:** ${game.time}
${game.map ? `🗺️ **Map:** ${game.map}\n` : ''}${game.mode ? `🎯 **Mode:** ${game.mode}\n` : ''}
**Sign up by reacting with your preferred role:**`

    // Add each role with signups
    for (const [emoji, roleName] of Object.entries(ROLE_MAP)) {
      messageContent += `\n${emoji} - ${roleName}`
      if (signupsByRole[emoji] && signupsByRole[emoji].length > 0) {
        for (const name of signupsByRole[emoji]) {
          messageContent += `\n${name}`
        }
      }
    }

    messageContent += `\n\n**[View Game Details & Lineup](<${gameLink}>)**`

    await message.edit(messageContent.trim())
  } catch (error) {
    console.error('Failed to update signup message:', error)
  }
}

client.on('clientReady', () => {
  console.log(`✅ Discord bot logged in as ${client.user?.tag}`)
  console.log(`🔧 Partials configured: Message, Channel, Reaction`)
  console.log(`👀 Listening for reactions on signup messages...`)
})

client.on('messageReactionAdd', async (reaction, user) => {
  try {
    // Fetch partial reactions (messages not in cache)
    if (reaction.partial) {
      try {
        await reaction.fetch()
        console.log(`🔄 Fetched partial reaction for message ${reaction.message.id}`)
      } catch (error) {
        console.error('❌ Failed to fetch reaction:', error)
        return
      }
    }

    // Ignore bot reactions
    if (user.bot) return

    const emoji = reaction.emoji.name
    console.log(`👉 Reaction received: ${emoji} from ${user.tag} on message ${reaction.message.id}`)

    if (!emoji || !ROLE_MAP[emoji]) {
      console.log(`ℹ️  Emoji ${emoji} not in role map, ignoring`)
      return
    }

    const rolePreference = ROLE_MAP[emoji]

    // Find game by discord_message_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name')
      .eq('discord_message_id', reaction.message.id)
      .single()

    if (gameError || !game) {
      console.log(`ℹ️  No game found for message ${reaction.message.id}`)
      return
    }

    // Find user in database by Discord ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, username, server_nickname')
      .eq('discord_id', user.id)
      .single()

    if (userError || !dbUser) {
      console.log(`⚠️  User ${user.tag} (${user.id}) not found in database`)
      return
    }

    // Update server nickname if we have guild context
    if (reaction.message.guild) {
      try {
        const member = await reaction.message.guild.members.fetch(user.id)
        const serverNickname = member.nickname || member.user.globalName || member.user.username

        // Update nickname in database if different
        if (serverNickname && serverNickname !== dbUser.server_nickname) {
          await supabase
            .from('users')
            .update({ server_nickname: serverNickname, updated_at: new Date().toISOString() })
            .eq('discord_id', user.id)

          console.log(`🔄 Updated nickname for ${user.tag}: ${serverNickname}`)
        }
      } catch (error) {
        console.error('Failed to fetch guild member:', error)
      }
    }

    // Check if already signed up
    const { data: existing } = await supabase
      .from('signups')
      .select('id')
      .eq('game_id', game.id)
      .eq('user_id', dbUser.id)
      .maybeSingle()

    if (existing) {
      console.log(`ℹ️  ${dbUser.server_nickname || dbUser.username} already signed up for ${game.name}`)
      return
    }

    // Create signup with role preference
    const { error: signupError } = await supabase
      .from('signups')
      .insert({
        game_id: game.id,
        user_id: dbUser.id,
        role_preference: rolePreference
      })

    if (signupError) {
      console.error(`❌ Failed to create signup for ${dbUser.server_nickname || dbUser.username}:`, signupError.message)
    } else {
      console.log(`✅ ${dbUser.server_nickname || dbUser.username} signed up for "${game.name}" as ${rolePreference}`)

      // Update the signup message to show who signed up
      await updateSignupMessage(reaction.message)
    }
  } catch (error) {
    console.error('❌ Error handling reaction:', error)
  }
})

client.on('messageReactionRemove', async (reaction, user) => {
  try {
    // Fetch partial reactions (messages not in cache)
    if (reaction.partial) {
      try {
        await reaction.fetch()
        console.log(`🔄 Fetched partial reaction for message ${reaction.message.id}`)
      } catch (error) {
        console.error('❌ Failed to fetch reaction:', error)
        return
      }
    }

    // Ignore bot reactions
    if (user.bot) return

    const emoji = reaction.emoji.name
    console.log(`👈 Reaction removed: ${emoji} from ${user.tag} on message ${reaction.message.id}`)

    if (!emoji || !ROLE_MAP[emoji]) {
      console.log(`ℹ️  Emoji ${emoji} not in role map, ignoring`)
      return
    }

    // Find game by discord_message_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id, name')
      .eq('discord_message_id', reaction.message.id)
      .single()

    if (gameError || !game) {
      console.log(`ℹ️  No game found for message ${reaction.message.id}`)
      return
    }

    // Find user in database by Discord ID
    const { data: dbUser, error: userError } = await supabase
      .from('users')
      .select('id, username, server_nickname')
      .eq('discord_id', user.id)
      .single()

    if (userError || !dbUser) {
      console.log(`⚠️  User ${user.tag} (${user.id}) not found in database`)
      return
    }

    // Find signup
    const { data: signup } = await supabase
      .from('signups')
      .select('id')
      .eq('game_id', game.id)
      .eq('user_id', dbUser.id)
      .maybeSingle()

    if (!signup) {
      console.log(`ℹ️  ${dbUser.server_nickname || dbUser.username} was not signed up for ${game.name}`)
      return
    }

    // Delete any assignments first
    const { error: assignmentError } = await supabase
      .from('game_assignments')
      .delete()
      .eq('signup_id', signup.id)

    if (assignmentError) {
      console.error(`❌ Failed to delete assignment:`, assignmentError.message)
    }

    // Delete signup
    const { error: signupError } = await supabase
      .from('signups')
      .delete()
      .eq('id', signup.id)

    if (signupError) {
      console.error(`❌ Failed to remove signup for ${dbUser.server_nickname || dbUser.username}:`, signupError.message)
    } else {
      console.log(`🗑️  ${dbUser.server_nickname || dbUser.username} removed from "${game.name}"`)

      // Update the signup message to remove the user
      await updateSignupMessage(reaction.message)
    }
  } catch (error) {
    console.error('❌ Error handling reaction removal:', error)
  }
})

client.on('error', (error) => {
  console.error('❌ Discord client error:', error)
})

// Log in to Discord
console.log('🚀 Starting Discord Gateway listener...')
client.login(process.env.DISCORD_BOT_TOKEN)
