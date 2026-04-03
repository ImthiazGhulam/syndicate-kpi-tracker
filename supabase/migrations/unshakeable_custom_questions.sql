-- Store AI-generated custom questions tailored to the client's specific problem
ALTER TABLE unshakeable_playbook ADD COLUMN IF NOT EXISTS custom_questions JSONB DEFAULT '{}';
