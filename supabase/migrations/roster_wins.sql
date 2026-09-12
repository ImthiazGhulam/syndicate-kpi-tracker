-- The Roster: wins table
-- Tracks client wins for retention conversations and proof

CREATE TABLE IF NOT EXISTS wins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES roster_clients(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  win_date DATE NOT NULL DEFAULT CURRENT_DATE,
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('touch', 'call', 'manual')),
  use_as_proof BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_wins_client ON wins (client_id);

-- RLS
ALTER TABLE wins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view wins for own roster clients"
  ON wins FOR SELECT
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can insert wins for own roster clients"
  ON wins FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can update wins for own roster clients"
  ON wins FOR UPDATE
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can delete wins for own roster clients"
  ON wins FOR DELETE
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));
