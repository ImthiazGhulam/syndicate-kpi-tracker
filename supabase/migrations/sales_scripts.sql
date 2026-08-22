-- Sales Call Script™ — versioned scripts per member per offer
CREATE TABLE IF NOT EXISTS sales_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  programme_name TEXT DEFAULT '',
  version INTEGER DEFAULT 1,
  generated_json JSONB DEFAULT '{}',
  edited_json JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON sales_scripts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_sales_scripts_client ON sales_scripts(client_id);
