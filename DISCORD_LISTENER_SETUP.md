# Discord Gateway Listener Setup Guide

## Prerequisites

Your Discord bot needs **Gateway Intents** enabled in Discord Developer Portal.

### Step 1: Enable Bot Intents

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your application
3. Go to **Bot** section
4. Scroll down to **Privileged Gateway Intents**
5. Enable these intents:
   - ✅ **PRESENCE INTENT** (optional)
   - ✅ **SERVER MEMBERS INTENT** (optional)
   - ✅ **MESSAGE CONTENT INTENT** ⚠️ **REQUIRED**
6. Click **Save Changes**

**⚠️ CRITICAL:** Without **MESSAGE CONTENT INTENT**, the bot cannot see reactions!

---

## Render.com Deployment

### Environment Variables

In Render dashboard, add these **3** environment variables:

| Variable Name | Where to Find It | Example |
|--------------|------------------|---------|
| `DISCORD_BOT_TOKEN` | Discord Dev Portal → Bot → Token | `MTIzNDU2Nzg5MDEyMzQ1Njc4.GAbCdE.fGhIjKlMnOpQrStUvWxYz` |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API | `https://abcdefgh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → service_role key | `eyJhbGciOiJIUzI1NiIsInR5cCI6...` |

**⚠️ IMPORTANT:** Use the **service_role** key, NOT the anon key! Service role bypasses RLS.

### Render Service Configuration

```yaml
Type: Background Worker (NOT Web Service)
Build Command: npm install
Start Command: npm run discord-bot
```

---

## Verification

### Check Render Logs

After deployment, check Render logs. You should see:

```
✅ Discord bot logged in as YourBotName#1234
👀 Listening for reactions on signup messages...
```

If you see this, the bot is running!

### Test Reaction

1. Go to a game signup message in Discord
2. React with an emoji (⚔️, 🎖️, 🔫, 🚗, or 🔭)
3. Check Render logs - should see:
   ```
   ✅ Username signed up for "Game Name" as Commander
   ```
4. Check your app's admin manage page - user should appear with role preference badge

---

## Troubleshooting

### No logs in Render

**Problem:** Service starts but shows no output

**Solution:**
1. Check Start Command is exactly: `npm run discord-bot`
2. Verify all 3 environment variables are set
3. Check Render didn't auto-detect wrong start command

### "Error: Used disallowed intents"

**Problem:** Bot lacks required intents

**Solution:**
1. Go to Discord Developer Portal → Bot
2. Enable **MESSAGE CONTENT INTENT**
3. Save changes
4. Redeploy on Render (trigger manual deploy)

### "Invalid token"

**Problem:** Wrong or expired bot token

**Solution:**
1. Discord Developer Portal → Bot → Reset Token
2. Copy NEW token
3. Update `DISCORD_BOT_TOKEN` in Render
4. Redeploy

### "Cannot find module 'discord.js'"

**Problem:** Dependencies not installed

**Solution:**
1. Check Build Command is: `npm install`
2. Verify `package.json` includes `discord.js`
3. Manually trigger new deployment

### Bot connects but doesn't respond to reactions

**Problem:** Missing MESSAGE CONTENT INTENT

**Solution:**
1. Enable MESSAGE CONTENT INTENT in Discord Portal
2. Save and redeploy

---

## Manual Testing

Run locally to test before deploying:

```bash
# Set environment variables
export DISCORD_BOT_TOKEN="your-token"
export NEXT_PUBLIC_SUPABASE_URL="your-url"
export SUPABASE_SERVICE_ROLE_KEY="your-key"

# Run listener
npm run discord-bot
```

You should see the "logged in" message. React to a signup message and watch the logs!

---

## Common Mistakes

❌ Using **anon key** instead of **service_role key**
❌ Forgetting to enable **MESSAGE CONTENT INTENT**
❌ Setting up as "Web Service" instead of "Background Worker"
❌ Wrong start command (should be `npm run discord-bot`)
❌ Bot not invited to Discord server with proper permissions

✅ Use service_role key
✅ Enable MESSAGE CONTENT INTENT
✅ Deploy as Background Worker
✅ Start command: `npm run discord-bot`
✅ Bot has Manage Channels, Send Messages, Add Reactions permissions
