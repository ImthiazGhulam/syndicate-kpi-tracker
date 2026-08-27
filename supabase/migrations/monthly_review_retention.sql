-- Monthly Review — Retention & Offer Breakdown columns
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS members_start INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS members_lost INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS churn_rate NUMERIC(5,1);
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS members_current INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS new_members INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS members_resigned INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS sales_from_dip INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS sales_from_bang_bang INTEGER;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS ran_launch BOOLEAN DEFAULT false;
ALTER TABLE monthly_review ADD COLUMN IF NOT EXISTS launch_offer TEXT;
