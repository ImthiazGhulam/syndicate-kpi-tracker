-- Lead Magnets table
create table if not exists lead_magnets (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references clients(id) on delete cascade,
  name text not null default '',
  promise text not null default '',
  keyword text not null default '',
  magnet_type text not null default 'guide' check (magnet_type in ('script_pack', 'checklist', 'guide', 'template', 'tracker', 'video_script', 'other')),
  problem_line text not null default '',
  method_steps jsonb default '[]'::jsonb,
  built_doc text,
  delivery_link text,
  dm_flow_live boolean default false,
  ladder_note text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Unique keyword per client
create unique index if not exists lead_magnets_client_keyword on lead_magnets(client_id, keyword) where keyword != '';

-- RLS
alter table lead_magnets enable row level security;

create policy "clients_manage_own_lead_magnets" on lead_magnets
  for all using (client_id = (select id from clients where email = auth.email()))
  with check (client_id = (select id from clients where email = auth.email()));

create policy "admin_read_lead_magnets" on lead_magnets
  for select using (true);
