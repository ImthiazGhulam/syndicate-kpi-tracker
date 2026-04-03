-- Drop the unique constraint so clients can have multiple playbook entries (one per problem)
ALTER TABLE unshakeable_playbook DROP CONSTRAINT IF EXISTS unshakeable_playbook_client_id_key;

-- Add problem statement column
ALTER TABLE unshakeable_playbook ADD COLUMN IF NOT EXISTS problem_statement TEXT DEFAULT '';

-- Add title column for quick reference
ALTER TABLE unshakeable_playbook ADD COLUMN IF NOT EXISTS title TEXT DEFAULT '';
