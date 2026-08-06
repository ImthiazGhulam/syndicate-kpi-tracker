-- Content Phases — Phase Planner for Content Strategy
-- Allows clients to plan multi-week content phases with reach/trust/sales week types

CREATE TABLE IF NOT EXISTS content_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  weeks JSONB NOT NULL DEFAULT '[]'::jsonb,
  -- weeks format: [{ "week": 1, "type": "trust" }, { "week": 2, "type": "sales" }, ...]
  -- type values: "reach", "trust", "sales"
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_phases_client_id ON content_phases(client_id);
CREATE INDEX IF NOT EXISTS idx_content_phases_active ON content_phases(client_id, is_active) WHERE is_active = TRUE;

ALTER TABLE content_phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own content_phases"
  ON content_phases FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.email()));

CREATE POLICY "Service role full access on content_phases"
  ON content_phases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
