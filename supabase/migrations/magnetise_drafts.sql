-- Magnetise™ drafts table
-- Run this in Supabase SQL Editor

create table magnetise_drafts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Step inputs
  capture text,
  common_advice text,
  contrarian text,

  -- Hook
  selected_hook text,

  -- Build
  build_format text check (build_format in ('story', 'list', 'steps')),
  build_inputs jsonb,
  build_output text,

  -- Payoff + CTA
  payoff text,
  cta_type text,
  cta_line text,

  -- Status
  status text default 'draft' check (status in ('draft', 'complete'))
);

-- RLS
alter table magnetise_drafts enable row level security;

create policy "clients_manage_own_magnetise_drafts"
  on magnetise_drafts
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "admin_read_magnetise_drafts"
  on magnetise_drafts
  for select
  using (true);

-- Auto-update updated_at (skip if function already exists from another migration)
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger magnetise_drafts_updated_at
  before update on magnetise_drafts
  for each row execute function update_updated_at();
