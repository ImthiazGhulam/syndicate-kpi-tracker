-- The Roster: resign_events table
-- Tracks the 45-day resign runway stages

CREATE TABLE IF NOT EXISTS resign_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES roster_clients(id) ON DELETE CASCADE,
  stage TEXT NOT NULL
    CHECK (stage IN ('t45_book_call', 't30_win_stack', 't14_script', 'call_outcome')),
  due_at DATE NOT NULL,
  completed_at TIMESTAMPTZ,
  outcome TEXT CHECK (outcome IN ('resigned', 'churned', 'pending')),
  churn_reason TEXT,
  new_term_end_date DATE,
  snooze_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_resign_events_client_due ON resign_events (client_id, due_at);

-- RLS
ALTER TABLE resign_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view resign events for own roster clients"
  ON resign_events FOR SELECT
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can insert resign events for own roster clients"
  ON resign_events FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can update resign events for own roster clients"
  ON resign_events FOR UPDATE
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));
