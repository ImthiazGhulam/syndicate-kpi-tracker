-- The Roster: roster_clients table
-- Tracks signed clients through retention lifecycle

CREATE TABLE IF NOT EXISTS roster_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone_e164 TEXT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  term_end_date DATE,
  status TEXT NOT NULL DEFAULT 'onboarding'
    CHECK (status IN ('onboarding', 'active', 'at_risk', 'resign_window', 'resigned', 'churned')),
  cadence_days INTEGER NOT NULL DEFAULT 10,
  red_days INTEGER NOT NULL DEFAULT 14,
  last_personal_touch_at TIMESTAMPTZ,
  last_work_contact_at TIMESTAMPTZ,
  health TEXT NOT NULL DEFAULT 'green'
    CHECK (health IN ('green', 'amber', 'red')),
  hot_list_card_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_roster_clients_coach_status ON roster_clients (coach_id, status);

-- RLS
ALTER TABLE roster_clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roster clients"
  ON roster_clients FOR SELECT
  USING (coach_id = auth.uid());

CREATE POLICY "Users can insert own roster clients"
  ON roster_clients FOR INSERT
  WITH CHECK (coach_id = auth.uid());

CREATE POLICY "Users can update own roster clients"
  ON roster_clients FOR UPDATE
  USING (coach_id = auth.uid());

CREATE POLICY "Users can delete own roster clients"
  ON roster_clients FOR DELETE
  USING (coach_id = auth.uid());
