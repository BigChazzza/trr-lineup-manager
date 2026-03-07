-- The Rogue Regiment Lineup Manager Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table: Stores Discord user information
create table if not exists public.users (
  id uuid primary key default uuid_generate_v4(),
  discord_id text unique not null,
  username text not null,
  avatar_url text,
  discord_roles jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Games table: Stores organized game events
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  date date not null,
  time time not null,
  map text,
  mode text,
  created_by uuid references public.users(id) on delete set null,
  playbook_id uuid,
  status text not null default 'draft' check (status in ('draft', 'open', 'closed', 'completed')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Playbooks table: Reusable tactical templates
create table if not exists public.playbooks (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  created_by uuid references public.users(id) on delete set null,
  is_default boolean default false,
  google_doc_link text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add foreign key for playbook_id in games (after playbooks table exists)
alter table public.games add constraint games_playbook_id_fkey
  foreign key (playbook_id) references public.playbooks(id) on delete set null;

-- Squads table: Squad definitions within playbooks
create table if not exists public.squads (
  id uuid primary key default uuid_generate_v4(),
  playbook_id uuid references public.playbooks(id) on delete cascade not null,
  name text not null,
  squad_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Squad roles table: Roles within each squad
create table if not exists public.squad_roles (
  id uuid primary key default uuid_generate_v4(),
  squad_id uuid references public.squads(id) on delete cascade not null,
  role_name text not null,
  role_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Squad tasks table: Tasks/objectives for each squad
create table if not exists public.squad_tasks (
  id uuid primary key default uuid_generate_v4(),
  squad_id uuid references public.squads(id) on delete cascade not null,
  task_description text not null,
  task_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Signups table: Player registrations for games
create table if not exists public.signups (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  signed_up_at timestamp with time zone default now(),
  added_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default now(),
  unique(game_id, user_id)
);

-- Game assignments table: Player assignments to squads and roles
create table if not exists public.game_assignments (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade not null,
  signup_id uuid references public.signups(id) on delete cascade not null,
  squad_id uuid references public.squads(id) on delete set null,
  role_id uuid references public.squad_roles(id) on delete set null,
  assigned_at timestamp with time zone default now(),
  assigned_by uuid references public.users(id) on delete set null,
  unique(game_id, signup_id)
);

-- Indexes for performance
create index if not exists idx_games_created_by on public.games(created_by);
create index if not exists idx_games_status on public.games(status);
create index if not exists idx_games_date on public.games(date);
create index if not exists idx_signups_game_id on public.signups(game_id);
create index if not exists idx_signups_user_id on public.signups(user_id);
create index if not exists idx_playbooks_created_by on public.playbooks(created_by);
create index if not exists idx_game_assignments_game_id on public.game_assignments(game_id);
create index if not exists idx_game_assignments_signup_id on public.game_assignments(signup_id);
create index if not exists idx_squads_playbook_id on public.squads(playbook_id);

-- Row-Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.users enable row level security;
alter table public.games enable row level security;
alter table public.playbooks enable row level security;
alter table public.squads enable row level security;
alter table public.squad_roles enable row level security;
alter table public.squad_tasks enable row level security;
alter table public.signups enable row level security;
alter table public.game_assignments enable row level security;

-- Users table policies
create policy "Users are viewable by everyone"
  on public.users for select
  using (true);

create policy "Users can update own profile"
  on public.users for update
  using (auth.uid()::text = id::text);

-- Games table policies
create policy "Games are viewable by everyone"
  on public.games for select
  using (true);

create policy "Authenticated users can create games"
  on public.games for insert
  with check (auth.role() = 'authenticated');

create policy "Game creators can update their games"
  on public.games for update
  using (auth.uid()::text = created_by::text);

create policy "Game creators can delete their games"
  on public.games for delete
  using (auth.uid()::text = created_by::text);

-- Playbooks table policies
create policy "Playbooks are viewable by everyone"
  on public.playbooks for select
  using (true);

create policy "Authenticated users can create playbooks"
  on public.playbooks for insert
  with check (auth.role() = 'authenticated');

create policy "Playbook creators can update their playbooks"
  on public.playbooks for update
  using (auth.uid()::text = created_by::text);

create policy "Playbook creators can delete their playbooks"
  on public.playbooks for delete
  using (auth.uid()::text = created_by::text);

-- Squads table policies
create policy "Squads are viewable by everyone"
  on public.squads for select
  using (true);

create policy "Authenticated users can create squads"
  on public.squads for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update squads in their playbooks"
  on public.squads for update
  using (
    exists (
      select 1 from public.playbooks
      where playbooks.id = squads.playbook_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

create policy "Users can delete squads in their playbooks"
  on public.squads for delete
  using (
    exists (
      select 1 from public.playbooks
      where playbooks.id = squads.playbook_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

-- Squad roles table policies
create policy "Squad roles are viewable by everyone"
  on public.squad_roles for select
  using (true);

create policy "Authenticated users can create squad roles"
  on public.squad_roles for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update squad roles in their playbooks"
  on public.squad_roles for update
  using (
    exists (
      select 1 from public.squads
      join public.playbooks on playbooks.id = squads.playbook_id
      where squads.id = squad_roles.squad_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

create policy "Users can delete squad roles in their playbooks"
  on public.squad_roles for delete
  using (
    exists (
      select 1 from public.squads
      join public.playbooks on playbooks.id = squads.playbook_id
      where squads.id = squad_roles.squad_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

-- Squad tasks table policies
create policy "Squad tasks are viewable by everyone"
  on public.squad_tasks for select
  using (true);

create policy "Authenticated users can create squad tasks"
  on public.squad_tasks for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update squad tasks in their playbooks"
  on public.squad_tasks for update
  using (
    exists (
      select 1 from public.squads
      join public.playbooks on playbooks.id = squads.playbook_id
      where squads.id = squad_tasks.squad_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

create policy "Users can delete squad tasks in their playbooks"
  on public.squad_tasks for delete
  using (
    exists (
      select 1 from public.squads
      join public.playbooks on playbooks.id = squads.playbook_id
      where squads.id = squad_tasks.squad_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

-- Signups table policies
create policy "Signups are viewable by everyone"
  on public.signups for select
  using (true);

create policy "Authenticated users can sign up for games"
  on public.signups for insert
  with check (auth.role() = 'authenticated');

create policy "Users can delete their own signups"
  on public.signups for delete
  using (auth.uid()::text = user_id::text);

-- Game assignments table policies
create policy "Game assignments are viewable by everyone"
  on public.game_assignments for select
  using (true);

create policy "Authenticated users can create assignments"
  on public.game_assignments for insert
  with check (auth.role() = 'authenticated');

create policy "Assignment creators can update assignments"
  on public.game_assignments for update
  using (auth.uid()::text = assigned_by::text);

create policy "Assignment creators can delete assignments"
  on public.game_assignments for delete
  using (auth.uid()::text = assigned_by::text);

-- Function to automatically update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger handle_updated_at before update on public.users
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.games
  for each row execute function public.handle_updated_at();

create trigger handle_updated_at before update on public.playbooks
  for each row execute function public.handle_updated_at();

-- Function to sync Discord user data
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, discord_id, username, avatar_url, discord_roles)
  values (
    new.id,
    new.raw_user_meta_data->>'provider_id',
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    '[]'::jsonb
  )
  on conflict (discord_id) do update set
    username = excluded.username,
    avatar_url = excluded.avatar_url,
    updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to sync user on auth.users insert
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Grant necessary permissions
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;

-- Success message
do $$
begin
  raise notice 'Database schema created successfully! You can now:';
  raise notice '1. Configure Discord OAuth in Supabase Authentication settings';
  raise notice '2. Update your .env.local file with Supabase credentials';
  raise notice '3. Run the Next.js development server';
end $$;
