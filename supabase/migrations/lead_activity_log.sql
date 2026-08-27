-- Lead Activity Log — tracks every stage change for monthly totals
CREATE TABLE IF NOT EXISTS lead_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  lead_name TEXT,
  to_stage TEXT NOT NULL,
  from_stage TEXT,
  offer_type TEXT,
  cash_collected NUMERIC(12,2),
  cash_contracted NUMERIC(12,2),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lead_activity_client_date ON lead_activity_log(client_id, created_at);

-- RLS
ALTER TABLE lead_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients can read own activity" ON lead_activity_log
  FOR SELECT USING (client_id = auth.uid() OR client_id IN (SELECT id FROM clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));

CREATE POLICY "Clients can insert own activity" ON lead_activity_log
  FOR INSERT WITH CHECK (client_id IN (SELECT id FROM clients WHERE email = (SELECT email FROM auth.users WHERE id = auth.uid())));
