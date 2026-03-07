# The Rogue Regiment - Lineup Manager

Hell Let Loose clan lineup and playbook management system for organized games.

## Features

- **Discord Authentication**: Sign in with Discord for all users
- **Admin Role Management**: 'Tactician' and 'Admin' Discord roles get admin access
- **Game Management**: Create and manage organized game events
- **Playbook System**: Create reusable squad templates with roles and tasks
- **Player Signup**: Players can sign themselves up for games
- **Squad Assignment**: Admins assign players to squads and roles
- **Lineup View**: Players see their assignments and squad tasks

## Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui
- **Backend**: Next.js Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Discord OAuth via Supabase
- **Hosting**: Vercel

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be provisioned
3. Go to **Settings** > **API** and copy:
   - Project URL
   - `anon` `public` API key

### 2. Set Up the Database

1. In your Supabase project, go to **SQL Editor**
2. Open the file `supabase/schema.sql` from this repository
3. Copy the entire contents and paste into the SQL Editor
4. Click "Run" to execute the schema creation
5. Verify all tables were created in **Table Editor**

### 3. Configure Discord OAuth

#### Create Discord Application

1. Go to [https://discord.com/developers/applications](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Rogue Regiment Lineup")
3. Go to **OAuth2** > **General**
4. Copy your:
   - Client ID
   - Client Secret (click "Reset Secret" if needed)
5. Add Redirect URIs:
   - For local dev: `https://<your-project-ref>.supabase.co/auth/v1/callback`
   - For production: Same URL (Supabase handles the redirect)

#### Configure in Supabase

1. In your Supabase project, go to **Authentication** > **Providers**
2. Find **Discord** and enable it
3. Paste your Discord Client ID and Client Secret
4. Save the configuration

### 4. Set Up Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### 5. Install Dependencies and Run

```bash
# Install dependencies (already done if you ran npm install)
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Usage

### For Players

1. **Sign in** with your Discord account
2. **Browse games** on the Games page
3. **Sign up** for upcoming games
4. **View lineup** to see your squad assignment and tasks

### For Admins (Tactician/Admin Discord Role)

1. **Create playbooks**:
   - Define squads (e.g., "Infantry Squad 1", "Armor Squad")
   - Add roles within each squad (e.g., "Squad Leader", "Rifleman")
   - Add tasks for each squad

2. **Create games**:
   - Set game details (name, date, time, map, mode)
   - Optionally apply a playbook template

3. **Manage lineups**:
   - View all signups for a game
   - Assign players to squads and roles
   - Players see their assignments immediately

## Discord Role Synchronization

**Important**: The system checks for 'Tactician' or 'Admin' Discord roles to grant admin access. You need to manually update the `discord_roles` field in the `users` table:

```sql
UPDATE users
SET discord_roles = '["Tactician"]'::jsonb
WHERE discord_id = 'your-discord-id';
```

**Future Enhancement**: Implement automatic Discord role syncing via Discord API or bot.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
├── components/       # React components
│   ├── auth/        # Authentication components
│   ├── games/       # Game-related components
│   ├── playbooks/   # Playbook components
│   └── ui/          # shadcn/ui components
├── lib/
│   ├── supabase/    # Supabase clients
│   ├── auth/        # Auth utilities
│   ├── db/          # Database query functions
│   └── types/       # TypeScript types
└── server-actions/  # Next.js Server Actions
```

## Deployment to Vercel

1. Push your code to GitHub
2. Go to [https://vercel.com](https://vercel.com) and import your repository
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_APP_URL` (set to your Vercel domain)
4. Deploy!
5. Update Discord OAuth redirect URIs if needed (should already work with Supabase URL)

## Database Schema

- **users**: Discord profile information and roles
- **games**: Organized game events
- **playbooks**: Reusable tactical templates
- **squads**: Squad definitions within playbooks
- **squad_roles**: Roles within each squad
- **squad_tasks**: Tasks for each squad
- **signups**: Player registrations for games
- **game_assignments**: Player-to-squad-role mappings

## Security

- Discord OAuth for authentication
- Row-Level Security (RLS) policies enforced at database level
- Admin role verification in middleware and Server Actions
- All mutations validated with Zod schemas

## Future Enhancements

- [ ] Automatic Discord role syncing via Discord bot
- [ ] Player availability notes during signup
- [ ] Discord webhook notifications for assignments
- [ ] Game history and statistics
- [ ] Playbook versioning
- [ ] Export lineup to Discord/PDF
- [ ] Real-time updates with Supabase Realtime

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build locally
npm run start

# Lint code
npm run lint
```

## Support

For issues or questions about the lineup manager, contact your clan admins or check the GitHub repository.

---

**The Rogue Regiment** - Hell Let Loose Clan
