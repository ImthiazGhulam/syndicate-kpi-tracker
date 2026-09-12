-- The Roster: add package_type to roster_clients + update resign_events stage values

-- Add package_type column
ALTER TABLE roster_clients
  ADD COLUMN IF NOT EXISTS package_type TEXT DEFAULT 'rolling'
    CHECK (package_type IN ('12_month', '6_month', '4_month', '3_month', '28_day', 'rolling'));

-- Update resign_events stage constraint to accept new proportional stage IDs
ALTER TABLE resign_events DROP CONSTRAINT IF EXISTS resign_events_stage_check;
ALTER TABLE resign_events ADD CONSTRAINT resign_events_stage_check
  CHECK (stage IN ('t45_book_call', 't30_win_stack', 't14_script', 'call_outcome', 't_book_call', 't_win_stack', 't_script'));
