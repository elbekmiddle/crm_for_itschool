-- Course enrollment lifecycle (transfer closes old row with ended_at)
ALTER TABLE student_courses ADD COLUMN IF NOT EXISTS started_at TIMESTAMP;
ALTER TABLE student_courses ADD COLUMN IF NOT EXISTS ended_at TIMESTAMP;
