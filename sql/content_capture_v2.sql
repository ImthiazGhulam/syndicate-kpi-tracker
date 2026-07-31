-- Content Capture V2 Schema
-- Creates tables: cc_profiles, cc_capture_log, cc_pieces, cc_weeks

-- ============================================================
-- cc_profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_profiles (
  client_id UUID PRIMARY KEY REFERENCES clients(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'start' CHECK (stage IN ('start','build','launch','recovery','ever')),
  has_list BOOLEAN DEFAULT FALSE,
  does_yt BOOLEAN DEFAULT FALSE,
  pieces_per_week INTEGER DEFAULT NULL,
  email_count INTEGER DEFAULT NULL,
  yt_count INTEGER DEFAULT NULL,
  voice_corrections JSONB DEFAULT '[]'::jsonb,
  voice_samples JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_profiles_client_id ON cc_profiles(client_id);

ALTER TABLE cc_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own cc_profiles"
  ON cc_profiles FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.email()));

CREATE POLICY "Service role full access on cc_profiles"
  ON cc_profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- cc_capture_log
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_capture_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('client','receipt','question','personal','industry','bts')),
  line TEXT NOT NULL,
  enrichment JSONB DEFAULT '{}'::jsonb,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_capture_log_client_id ON cc_capture_log(client_id);

ALTER TABLE cc_capture_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own cc_capture_log"
  ON cc_capture_log FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.email()));

CREATE POLICY "Service role full access on cc_capture_log"
  ON cc_capture_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- cc_pieces
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_pieces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  moment_id UUID REFERENCES cc_capture_log(id),
  job TEXT CHECK (job IN ('reach','value','sales','email','longform')),
  format TEXT,
  card_key TEXT,
  draft TEXT,
  status TEXT DEFAULT 'draft',
  suggested_day TEXT,
  week_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_pieces_client_id ON cc_pieces(client_id);

ALTER TABLE cc_pieces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own cc_pieces"
  ON cc_pieces FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.email()));

CREATE POLICY "Service role full access on cc_pieces"
  ON cc_pieces FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================
-- cc_weeks
-- ============================================================
CREATE TABLE IF NOT EXISTS cc_weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  mix JSONB,
  piece_ids JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cc_weeks_client_id ON cc_weeks(client_id);

ALTER TABLE cc_weeks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients manage own cc_weeks"
  ON cc_weeks FOR ALL
  USING (client_id IN (SELECT id FROM clients WHERE email = auth.email()));

CREATE POLICY "Service role full access on cc_weeks"
  ON cc_weeks FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
