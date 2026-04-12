-- exam_attempts: violation counter (server-side anti-cheat)
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS violation_count INTEGER NOT NULL DEFAULT 0;

-- Per-event log (optional analytics / audit)
CREATE TABLE IF NOT EXISTS exam_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    violation_type VARCHAR(64) NOT NULL DEFAULT 'unknown',
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_violations_attempt ON exam_violations(attempt_id);
