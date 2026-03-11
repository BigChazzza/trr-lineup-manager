-- Add role_tasks table for tasks specific to individual roles
create table if not exists public.role_tasks (
  id uuid primary key default uuid_generate_v4(),
  role_id uuid references public.squad_roles(id) on delete cascade not null,
  task_description text not null,
  task_order integer not null default 0,
  created_at timestamp with time zone default now()
);

-- Create index for performance
create index if not exists idx_role_tasks_role_id on public.role_tasks(role_id);

-- Enable RLS
alter table public.role_tasks enable row level security;

-- RLS Policies
create policy "Role tasks are viewable by everyone"
  on public.role_tasks for select
  using (true);

create policy "Authenticated users can create role tasks"
  on public.role_tasks for insert
  with check (auth.role() = 'authenticated');

create policy "Users can update role tasks in their playbooks"
  on public.role_tasks for update
  using (
    exists (
      select 1 from public.squad_roles
      join public.squads on squads.id = squad_roles.squad_id
      join public.playbooks on playbooks.id = squads.playbook_id
      where squad_roles.id = role_tasks.role_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

create policy "Users can delete role tasks in their playbooks"
  on public.role_tasks for delete
  using (
    exists (
      select 1 from public.squad_roles
      join public.squads on squads.id = squad_roles.squad_id
      join public.playbooks on playbooks.id = squads.playbook_id
      where squad_roles.id = role_tasks.role_id
      and playbooks.created_by::text = auth.uid()::text
    )
  );

-- Grant permissions
grant all on public.role_tasks to anon, authenticated;

-- Success message
do $$
begin
  raise notice 'Role tasks table created successfully!';
  raise notice 'You can now assign specific tasks to individual roles within squads.';
end $$;
