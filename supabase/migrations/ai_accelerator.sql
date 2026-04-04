-- AI Accelerator™ — clients build AI tools for their business
CREATE TABLE IF NOT EXISTS ai_accelerator (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  title TEXT DEFAULT '',
  problem_statement TEXT DEFAULT '',
  manual_process TEXT DEFAULT '',
  ideal_output TEXT DEFAULT '',
  where_it_breaks TEXT DEFAULT '',
  generated_tool JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ai_accelerator ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON ai_accelerator
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_ai_accelerator_client ON ai_accelerator(client_id);
