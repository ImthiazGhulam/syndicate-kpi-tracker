-- Monthly Review Metrics Expansion
-- Adds 19 new metric columns to monthly_review table
-- Existing columns untouched

ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS new_followers INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS short_form_posted INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS lead_magnet_downloads INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS link_in_bio_clicks INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS email_list_size INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS emails_sent INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS long_form_posted INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS total_watch_time NUMERIC(10,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS dms_sent INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS offers_made INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS offer_docs_sent INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS calls_booked INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS calls_shown INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS calls_closed INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS cash_collected NUMERIC(12,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS cash_contracted NUMERIC(12,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS money_in NUMERIC(12,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS money_out NUMERIC(12,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS personal_pay NUMERIC(12,2);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS profit NUMERIC(12,2);
