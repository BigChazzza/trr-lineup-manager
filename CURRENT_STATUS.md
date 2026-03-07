# The Rogue Regiment - Current Status

## ✅ What's Working Now

### Authentication & Authorization
- ✅ Discord OAuth login (fixed!)
- ✅ Session persistence across page loads
- ✅ Admin role checking ('Tactician' or 'Admin')
- ✅ User menu with logout
- ✅ Route protection for admin pages

### Game Management
- ✅ Create games with all fields:
  - Name, date, time
  - Map selection (17 HLL maps)
  - Mode selection (Warfare, Offensive, Skirmish)
  - **Game size (35vs35, 40vs40, 50vs50)** ← Just added!
  - Status (draft/open/closed/completed)
  - Optional playbook assignment
- ✅ View all games organized by status
- ✅ Game detail page (fixed the 404 issue!)
- ✅ Admin dashboard at `/admin/dashboard`

### Player Features
- ✅ Browse all open games
- ✅ Sign up for games (one-click signup)
- ✅ Remove signup
- ✅ View signed up players
- ✅ Lineup view (shows squads, roles, tasks from playbook)

### Playbook System
- ✅ Browse playbooks
- ✅ View playbook details (squads, roles, tasks)
- ✅ Apply playbook to games

## 🏗️ What Still Needs Building

### Priority Features
1. **Playbook Builder UI** (currently requires SQL)
   - Visual editor for creating squads
   - Add/remove roles within squads
   - Define tasks for each squad

2. **Squad Assignment Interface** (currently manual via SQL)
   - Drag-and-drop players to squads
   - Assign roles to players
   - Visual lineup management

3. **Discord Role Sync**
   - Automatic fetching of user's Discord roles
   - Currently requires manual SQL update

### Nice-to-Have Enhancements
- Real-time lineup updates (Supabase Realtime)
- Discord webhook notifications
- Export lineup to Discord/PDF
- Player availability notes
- Game history and statistics

## 🔧 Recent Fixes

1. ✅ Fixed auth callback cookie handling
2. ✅ Fixed game detail page query (ambiguous foreign key)
3. ✅ Added game size field (35vs35, 40vs40, 50vs50)
4. ✅ Created admin dashboard
5. ✅ Removed error log spam

## 📝 Quick SQL Commands

### Add Game Size Column (if not done)
```sql
ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS game_size text;
```

### Give User Admin Access
```sql
-- Find your discord_id
SELECT id, discord_id, username FROM users;

-- Add Tactician role
UPDATE users
SET discord_roles = '["Tactician"]'::jsonb
WHERE discord_id = 'YOUR_DISCORD_ID';
```

### Create a Sample Playbook
```sql
-- 1. Create playbook
INSERT INTO playbooks (name, description, created_by, is_default)
VALUES (
  'Standard Infantry Setup',
  'Basic infantry squad structure for Warfare mode',
  (SELECT id FROM users WHERE discord_roles @> '["Tactician"]' LIMIT 1),
  true
)
RETURNING id;
-- Copy the returned ID

-- 2. Create squads (replace PLAYBOOK_ID)
INSERT INTO squads (playbook_id, name, squad_order) VALUES
('PLAYBOOK_ID', 'Infantry Squad 1', 1),
('PLAYBOOK_ID', 'Infantry Squad 2', 2),
('PLAYBOOK_ID', 'Armor Squad', 3)
RETURNING id;
-- Copy the squad IDs

-- 3. Add roles (replace SQUAD_IDs)
INSERT INTO squad_roles (squad_id, role_name, role_order) VALUES
('INFANTRY_SQUAD_1_ID', 'Squad Leader', 1),
('INFANTRY_SQUAD_1_ID', 'Rifleman', 2),
('INFANTRY_SQUAD_1_ID', 'Automatic Rifleman', 3),
('INFANTRY_SQUAD_1_ID', 'Medic', 4),
('INFANTRY_SQUAD_1_ID', 'Engineer', 5),
('INFANTRY_SQUAD_1_ID', 'Anti-Tank', 6);

-- 4. Add tasks
INSERT INTO squad_tasks (squad_id, task_description, task_order) VALUES
('INFANTRY_SQUAD_1_ID', 'Secure and hold the center point', 1),
('INFANTRY_SQUAD_1_ID', 'Build garrison at key location', 2),
('INFANTRY_SQUAD_1_ID', 'Support flanking maneuvers', 3);
```

### Manually Assign Players to Squads
```sql
-- First get IDs
SELECT s.id as signup_id, g.name as game, u.username
FROM signups s
JOIN games g ON g.id = s.game_id
JOIN users u ON u.id = s.user_id;

SELECT sq.id as squad_id, sq.name as squad_name, sr.id as role_id, sr.role_name
FROM squads sq
JOIN squad_roles sr ON sr.squad_id = sq.id
JOIN playbooks pb ON pb.id = sq.playbook_id
WHERE pb.name = 'YOUR_PLAYBOOK_NAME';

-- Assign player
INSERT INTO game_assignments (game_id, signup_id, squad_id, role_id, assigned_by)
VALUES (
  'GAME_ID',
  'SIGNUP_ID',
  'SQUAD_ID',
  'ROLE_ID',
  (SELECT id FROM users WHERE discord_roles @> '["Tactician"]' LIMIT 1)
);
```

## 🎮 Current Workflow

### For Players
1. Sign in with Discord ✅
2. Browse games at `/games` ✅
3. Click on a game to view details ✅
4. Click "Sign Up" to register ✅
5. View lineup to see squad assignments ✅

### For Admins
1. Go to Admin Dashboard at `/admin/dashboard` ✅
2. Click "Create New Game" ✅
3. Fill out form (name, date, time, map, mode, size) ✅
4. Select playbook (if you've created one) ✅
5. Game appears in games list ✅
6. Manually assign players via SQL (until UI is built) ⏳

## Next Steps

Try the full workflow now:
1. Click on a game - should work! ✅
2. Sign up for the game ✅
3. Add game_size column to database
4. Create a new game with size selection
5. (Optional) Create a playbook via SQL to see full lineup features

Everything is working except the playbook builder UI and drag-and-drop assignment interface, which can be added as enhancements!
