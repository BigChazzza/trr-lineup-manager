# Authentication Troubleshooting Guide

## The Issue
Discord OAuth callback is executing, but the session isn't persisting after redirect. You see your user in Supabase but the "Sign in with Discord" button doesn't change.

## What I Just Fixed
Updated the `/auth/callback` route to properly handle cookies during the OAuth code exchange.

## Steps to Test Now

### 1. Restart Dev Server (REQUIRED)
```bash
# Stop current server
# Press Ctrl+C in the terminal running npm run dev

# Clear any stale processes
pkill -f "next dev"

# Start fresh
npm run dev
```

### 2. Clear Browser State
Before testing, clear everything:
- Open DevTools (F12)
- Application tab → Clear site data
- Or use **Incognito/Private mode** (recommended)

### 3. Verify Discord OAuth Redirect URI

**This is the #1 cause of auth issues!**

Your Discord application redirect URI should be:
```
https://YOUR-PROJECT-ID.supabase.co/auth/v1/callback
```

**NOT**:
- ❌ `http://localhost:3000/auth/callback`
- ❌ `http://localhost:3000/auth/callback/`
- ❌ Any other localhost URL

**Where to check:**
1. Discord Developer Portal
2. Your application → OAuth2 → General
3. Redirects section
4. Should ONLY have the Supabase URL

### 4. Test Authentication Flow

1. Visit http://localhost:3000 in **incognito mode**
2. Open DevTools Console (F12) to watch for errors
3. Click "Sign in with Discord"
4. Authorize the app
5. **Wait for redirect** - you should see your username in header

### 5. Check the Debug Page

Visit http://localhost:3000/auth/debug

**Expected results:**
- ✅ SUPABASE_URL: Set
- ✅ SUPABASE_ANON_KEY: Set
- ✅ Session: Active
- ✅ User: Authenticated
- Shows your Discord ID

**If session is NOT active:**
- Check browser console for errors
- Check server logs for errors
- Verify redirect URI in Discord app

### 6. Common Issues & Fixes

#### Issue: "Session: ❌ No session" on debug page
**Causes:**
- Wrong redirect URI in Discord (must be Supabase URL)
- Browser blocking third-party cookies (try incognito)
- Discord OAuth not enabled in Supabase

**Fix:**
1. Double-check Discord redirect URI
2. Go to Supabase → Authentication → Providers → Discord
3. Verify it's enabled and credentials are correct
4. Save and try again

#### Issue: Login works but session disappears on refresh
**Causes:**
- Cookies not being set with correct domain/path
- Middleware interfering with auth cookies

**Fix:**
- Already fixed in latest code
- Restart server and clear browser cache

#### Issue: "Failed to submit form" when creating game
**Causes:**
- Server action cache issue
- Old build artifacts

**Fix:**
```bash
rm -rf .next
npm run dev
```

## Manual Verification

### Check Cookies in Browser
1. DevTools → Application → Cookies → http://localhost:3000
2. Look for cookies starting with `sb-`
3. Should see `sb-YOUR-PROJECT-access-token` and `sb-YOUR-PROJECT-refresh-token`

### Check Supabase Auth
In Supabase dashboard:
1. Authentication → Users
2. You should see your Discord user listed
3. Note the User UID

### Manually Add Admin Role
Once logged in successfully:

```sql
-- In Supabase SQL Editor
-- First find your user
SELECT id, discord_id, username, discord_roles FROM users;

-- Then add Tactician role
UPDATE users
SET discord_roles = '["Tactician"]'::jsonb
WHERE discord_id = 'YOUR_DISCORD_ID';

-- Verify
SELECT username, discord_roles FROM users WHERE discord_id = 'YOUR_DISCORD_ID';
```

After this, **sign out and sign back in** for role to take effect.

## Still Not Working?

If after all these steps it's still not working, check:

1. **Environment Variables** - Verify `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

2. **Discord OAuth Setup**:
   - Client ID and Secret in Supabase match Discord app
   - OAuth is enabled for your Discord account (not banned)
   - App has correct scopes (identify, email)

3. **Supabase RLS Policies**:
   - Ensure policies allow reading from `users` table
   - Check Supabase logs for any errors

4. **Network Issues**:
   - Check browser Network tab during login
   - Look for failed requests
   - Check for CORS errors

## Success Checklist

You'll know it's working when:
- ✅ After Discord auth, you see your username in header (not "Sign in" button)
- ✅ Debug page shows active session and user info
- ✅ You can navigate pages without losing session
- ✅ After adding admin role, you see "Admin" badge
- ✅ You can access /games/admin/create
- ✅ Game creation form submits successfully

---

**Need help?** Check the server console logs and browser console for specific error messages.
