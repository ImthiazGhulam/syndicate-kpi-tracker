-- The Roster: per-client follow-up reminders

ALTER TABLE roster_clients
  ADD COLUMN IF NOT EXISTS reminder_date DATE,
  ADD COLUMN IF NOT EXISTS reminder_note TEXT;
