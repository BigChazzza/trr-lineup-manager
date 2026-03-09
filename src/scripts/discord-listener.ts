import { Client, GatewayIntentBits, Partials } from 'discord.js'
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
      .select('id, username')
      .eq('discord_id', user.id)
      .single()

    if (userError || !dbUser) {
      console.log(`⚠️  User ${user.tag} (${user.id}) not found in database`)
      return
    }

    // Check if already signed up
    const { data: existing } = await supabase
      .from('signups')
      .select('id')
      .eq('game_id', game.id)
      .eq('user_id', dbUser.id)
      .maybeSingle()

    if (existing) {
      console.log(`ℹ️  ${dbUser.username} already signed up for ${game.name}`)
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
      console.error(`❌ Failed to create signup for ${dbUser.username}:`, signupError.message)
    } else {
      console.log(`✅ ${dbUser.username} signed up for "${game.name}" as ${rolePreference}`)
    }
  } catch (error) {
    console.error('❌ Error handling reaction:', error)
  }
})

client.on('error', (error) => {
  console.error('❌ Discord client error:', error)
})

// Log in to Discord
console.log('🚀 Starting Discord Gateway listener...')
client.login(process.env.DISCORD_BOT_TOKEN)
