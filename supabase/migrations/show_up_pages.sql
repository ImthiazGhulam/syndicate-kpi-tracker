-- The Show Up Page Builder™ table
-- Stores pulled data, gap answers, client wins, tone profile, and generated output

create table if not exists show_up_pages (
  id uuid default gen_random_uuid() primary key,
  client_id uuid references clients(id) on delete cascade not null,
  build_gaps jsonb default '{}'::jsonb,
  client_wins jsonb default '[]'::jsonb,
  tone_profile jsonb default '{}'::jsonb,
  gap_answers jsonb default '{}'::jsonb,
  generated_output jsonb default '{}'::jsonb,
  status text default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table show_up_pages enable row level security;

create policy "clients_manage_own_show_up_pages"
  on show_up_pages for all
  using (client_id in (select id from clients where email = auth.email()))
  with check (client_id in (select id from clients where email = auth.email()));

create policy "service_role_show_up_pages"
  on show_up_pages for all
  to service_role
  using (true)
  with check (true);

create or replace function update_show_up_pages_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger show_up_pages_updated_at
  before update on show_up_pages
  for each row
  execute function update_show_up_pages_updated_at();
