-- The Roster: touches table
-- Logs personal and work contacts with clients

CREATE TABLE IF NOT EXISTS touches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES roster_clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('personal', 'work')),
  channel TEXT NOT NULL DEFAULT 'other' CHECK (channel IN ('whatsapp', 'other', 'call')),
  message_text TEXT,
  ai_drafted BOOLEAN NOT NULL DEFAULT false,
  life_note_id UUID REFERENCES life_notes(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_touches_client_sent ON touches (client_id, sent_at DESC);

-- RLS
ALTER TABLE touches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view touches for own roster clients"
  ON touches FOR SELECT
  USING (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));

CREATE POLICY "Users can insert touches for own roster clients"
  ON touches FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM roster_clients WHERE coach_id = auth.uid()));
