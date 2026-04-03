-- Per-day completion tracking for recurring war map tasks
CREATE TABLE IF NOT EXISTS war_map_task_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID NOT NULL REFERENCES war_map_tasks(id) ON DELETE CASCADE,
  completion_date DATE NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(task_id, completion_date)
);

ALTER TABLE war_map_task_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all for authenticated users" ON war_map_task_completions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE INDEX idx_task_completions_task ON war_map_task_completions(task_id);
CREATE INDEX idx_task_completions_date ON war_map_task_completions(completion_date);
