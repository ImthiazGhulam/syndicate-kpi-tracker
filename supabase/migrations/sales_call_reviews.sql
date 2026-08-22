-- Sales Coach™ — call transcript reviews
CREATE TABLE IF NOT EXISTS sales_call_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  call_outcome TEXT DEFAULT '',
  call_notes TEXT DEFAULT '',
  analysis_json JSONB DEFAULT '{}',
  script_id UUID REFERENCES sales_scripts(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sales_call_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON sales_call_reviews
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_sales_call_reviews_client ON sales_call_reviews(client_id);
