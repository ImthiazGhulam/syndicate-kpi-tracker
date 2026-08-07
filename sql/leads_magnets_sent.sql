-- Add magnets_sent JSONB column to leads table
-- Stores array of sent magnets: [{ "magnet_id": "uuid", "name": "...", "keyword": "...", "sent_at": "..." }, ...]

ALTER TABLE leads ADD COLUMN IF NOT EXISTS magnets_sent JSONB DEFAULT '[]'::jsonb;
