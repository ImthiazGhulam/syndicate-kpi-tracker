-- Comeback Story™ table
-- Stores each client's carousel story drafts through 4 stages

create table if not exists comeback_stories (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  collapse_type text not null default 'something-else',
  dump text default '',
  story_map jsonb default '{}'::jsonb,
  chosen_motif text default '',
  gap_answers jsonb default '{}'::jsonb,
  slides jsonb default '[]'::jsonb,
  caption text default '',
  current_stage integer default 1,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table comeback_stories enable row level security;

-- Clients can manage their own stories
create policy "clients_manage_own_comeback_stories"
  on comeback_stories for all
  using (client_id in (select id from clients where email = auth.email()))
  with check (client_id in (select id from clients where email = auth.email()));

-- Service role full access (admin/backend)
create policy "service_role_comeback_stories"
  on comeback_stories for all
  to service_role
  using (true)
  with check (true);

-- Auto-update updated_at
create or replace function update_comeback_stories_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger comeback_stories_updated_at
  before update on comeback_stories
  for each row
  execute function update_comeback_stories_updated_at();
