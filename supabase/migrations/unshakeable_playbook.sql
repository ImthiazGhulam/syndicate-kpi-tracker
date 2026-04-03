-- Un-Shakeable™ Playbook — mirrors wealth_wired table structure with 5 frameworks
CREATE TABLE IF NOT EXISTS unshakeable_playbook (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  current_framework INTEGER DEFAULT 1,
  framework_1 JSONB DEFAULT '{"reflection":"","audit":"","go_deeper":""}',
  framework_2 JSONB DEFAULT '{"reflection":"","audit":"","go_deeper":""}',
  framework_3 JSONB DEFAULT '{"reflection":"","audit":"","go_deeper":""}',
  framework_4 JSONB DEFAULT '{"reflection":"","audit":"","go_deeper":""}',
  framework_5 JSONB DEFAULT '{"reflection":"","audit":"","go_deeper":""}',
  scores JSONB DEFAULT '{}',
  generated_plan TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(client_id)
);

ALTER TABLE unshakeable_playbook ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON unshakeable_playbook
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_unshakeable_client ON unshakeable_playbook(client_id);
