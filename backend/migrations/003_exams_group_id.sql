-- Optional: link exam to a specific group (better context for AI + teacher UX)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_exams_group_id ON exams(group_id) WHERE group_id IS NOT NULL;
