-- Admin Daily Checklist — stores which items the coach has ticked off each day
CREATE TABLE IF NOT EXISTS admin_daily_checklist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  checklist_date DATE NOT NULL,
  item_key TEXT NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(checklist_date, item_key)
);

-- RLS
ALTER TABLE admin_daily_checklist ENABLE ROW LEVEL SECURITY;

-- Allow all operations (admin-only page, auth checked in app)
CREATE POLICY "Allow all for authenticated users" ON admin_daily_checklist
  FOR ALL USING (auth.role() = 'authenticated');

-- Index for fast lookups by date
CREATE INDEX idx_admin_checklist_date ON admin_daily_checklist(checklist_date);
