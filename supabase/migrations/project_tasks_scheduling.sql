-- Add scheduling fields to project_tasks so they can appear on the calendar
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS scheduled_time TIME;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE project_tasks ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- Index for calendar lookups
CREATE INDEX IF NOT EXISTS idx_project_tasks_scheduled ON project_tasks(scheduled_date);
