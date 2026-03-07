# The Rogue Regiment - Setup Guide

## What's Been Built

Your Hell Let Loose lineup manager is now ready to use! Here's what's been implemented:

### ✅ Core Features
- **Discord Authentication** - Sign in with Discord
- **Game Management** - Create and list games
- **Player Signup** - Players can sign up for games
- **Lineup View** - View squad assignments and tasks
- **Playbook System** - Browse playbooks with squad templates
- **Admin Tools** - Admin routes for game/playbook management

### 🏗️ Database
- Complete PostgreSQL schema with 8 tables
- Row-Level Security (RLS) policies
- Automatic Discord user syncing

## Quick Start

### 1. Verify Your Setup

Make sure you've completed these steps:

- [x] Created Supabase project
- [x] Ran `supabase/schema.sql` in SQL Editor
- [x] Set up Discord OAuth application
- [x] Configured Discord provider in Supabase
- [x] Created `.env.local` with credentials

### 2. Your `.env.local` Should Look Like This:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Start the Development Server

```bash
npm run dev
```

Visit: **http://localhost:3000**

## Testing Your Application

### Test Authentication

1. Click "Sign in with Discord"
2. Authorize the application
3. You should be redirected back and see your Discord username in the header

**Important**: After first login, manually update your Discord roles in Supabase:

```sql
-- In Supabase SQL Editor, update your user to have admin access:
UPDATE users
SET discord_roles = '["Tactician"]'::jsonb
WHERE discord_id = 'YOUR_DISCORD_ID';
```

To find your Discord ID, query:
```sql
SELECT * FROM users;
```

### Test Game Management (Admin Only)

1. After setting admin role, refresh the page
2. You should see "Admin" badge next to your name
3. Click "Create Game" in the header or home page
4. Fill out the game form:
   - Name: "Test Match vs Alpha Company"
   - Date: Pick a future date
   - Time: Pick a time (e.g., 20:00)
   - Map: Select from dropdown
   - Mode: Select "Warfare"
   - Status: "Open for Signups"
5. Submit and you should see the game on `/games`

### Test Player Signup

1. Click on the game you created
2. Click "Sign Up" button
3. You should see yourself in the "Signed Up" list
4. The button should change to "Remove Signup"

### Test Lineup View

Without assignments, you'll see "No lineup configured yet" message. This is expected!

## Creating a Playbook

You can now create playbooks through the web interface!

### Step 1: Navigate to Create Playbook

1. Make sure you're logged in with admin privileges (Tactician role)
2. Go to `/playbooks/admin/create` or click "Create Playbook" from the playbooks page
3. You should see the playbook creation form

### Step 2: Use a Template (Recommended)

Click "Load Offensive Units" to automatically populate the form with:
- Squad 1.1 - Playing left hand side
- Squad 1.2 - Playing Central left
- Squad 1.3 - Playing Central right
- Squad 1.4 - Playing right hand side

Each squad comes pre-configured with roles and tasks that you can customize.

### Step 3: Customize Your Playbook

**Basic Info:**
- Enter a playbook name (or keep the template name)
- Add/edit the description
- Check "Set as default" to make it the default playbook for new games

**Squads:**
- Add more squads with the "Add Squad" button
- Rename squads to fit your tactical needs
- Reorder squads using the up/down arrow buttons
- Remove squads with the trash icon

**Roles:**
- Each squad must have at least one role
- Add roles with "Add Role" button
- Reorder roles within each squad
- Remove roles (except the last one)

**Tasks:**
- Tasks are optional objectives for each squad
- Add tasks with "Add Task" button
- Reorder or remove tasks as needed

### Step 4: Create Playbook

Click "Create Playbook" to save. The playbook will be immediately available for use in games.

### Step 5: Apply Playbook to a Game

When creating or editing a game:
1. Select your new playbook from the "Playbook" dropdown
2. Save the game
3. The lineup view will automatically show all squads, roles, and tasks

### Step 6: View the Lineup!

1. Go to your game page at `/games/[your-game-id]`
2. You should now see all squads with roles and tasks
3. Players can see which roles are available (all unassigned for now)

## Manually Assigning Players (Temporary)

Until the drag-and-drop assignment interface is built, you can manually assign players:

```sql
-- First, get the IDs you need:
SELECT s.id as signup_id, g.name as game, u.username
FROM signups s
JOIN games g ON g.id = s.game_id
JOIN users u ON u.id = s.user_id;

-- Get squad and role IDs:
SELECT sq.id as squad_id, sq.name as squad_name, sr.id as role_id, sr.role_name
FROM squads sq
JOIN squad_roles sr ON sr.squad_id = sq.id
WHERE sq.playbook_id = 'YOUR_PLAYBOOK_ID';

-- Now assign a player:
INSERT INTO game_assignments (game_id, signup_id, squad_id, role_id, assigned_by)
VALUES (
  'GAME_ID',
  'SIGNUP_ID',
  'SQUAD_ID',
  'ROLE_ID',
  'YOUR_USER_ID'
);
```

After inserting assignments, refresh the game page and you'll see players assigned to roles!

## Next Steps

### Immediate Enhancements Needed

1. ~~**Playbook Builder UI**~~ - ✅ Complete! Create playbooks at `/playbooks/admin/create`
2. **Squad Assignment Interface** - Drag-and-drop player assignment
3. **Discord Role Sync** - Automatic role checking via Discord API

### Future Features

- Real-time lineup updates
- Discord webhook notifications
- Game history and statistics
- Export lineup to PDF/Discord
- Mobile-responsive improvements

## Troubleshooting

### "Not authenticated" errors
- Clear browser cookies and sign in again
- Check `.env.local` has correct Supabase credentials

### Admin features not showing
- Run the SQL command to add 'Tactician' role to your user
- Sign out and sign in again

### Games not showing
- Check that game status is 'open'
- Check game date is today or in the future

### Discord OAuth errors
- Verify redirect URI in Discord app matches Supabase
- Check Discord Client ID and Secret in Supabase Auth settings

## Deployment to Vercel

When you're ready:

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables (same as `.env.local` but update `NEXT_PUBLIC_APP_URL`)
4. Deploy!

## Support

- Check [README.md](README.md) for full documentation
- Review [supabase/schema.sql](supabase/schema.sql) for database structure
- Test everything locally before deploying

---

**The Rogue Regiment** - Good luck on the battlefield! 🎖️
