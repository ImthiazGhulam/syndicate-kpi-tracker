-- Pipeline Insights cache — one row per client, upserted on each analysis

CREATE TABLE IF NOT EXISTS pipeline_insights_cache (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  insights JSONB NOT NULL,
  cards_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE pipeline_insights_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own insights cache"
  ON pipeline_insights_cache FOR SELECT
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can upsert own insights cache"
  ON pipeline_insights_cache FOR INSERT
  WITH CHECK (client_id IN (SELECT id FROM clients WHERE email = auth.jwt()->>'email'));

CREATE POLICY "Users can update own insights cache"
  ON pipeline_insights_cache FOR UPDATE
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.jwt()->>'email'));
