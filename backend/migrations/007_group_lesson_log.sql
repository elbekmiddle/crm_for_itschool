-- Guruh bo‘yicha kunlik dars mavzusi (bir guruh + sana = bitta yozuv)
CREATE TABLE IF NOT EXISTS group_lesson_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
  lesson_date DATE NOT NULL,
  topic TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (group_id, lesson_date)
);

CREATE INDEX IF NOT EXISTS idx_group_lesson_log_group_date ON group_lesson_log (group_id, lesson_date);
