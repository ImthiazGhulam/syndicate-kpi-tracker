-- The Roster: life_notes table
-- Personal notes about clients for relationship-driven outreach

CREATE TABLE IF NOT EXISTS life_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES roster_clients(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('onboarding', 'post_call', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_life_notes_client ON life_notes (client_id);

-- RLS
ALTER TABLE life_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view life notes for own roster clients"
  ON life_notes FOR SELECT
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can insert life notes for own roster clients"
  ON life_notes FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can update life notes for own roster clients"
  ON life_notes FOR UPDATE
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can delete life notes for own roster clients"
  ON life_notes FOR DELETE
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));
