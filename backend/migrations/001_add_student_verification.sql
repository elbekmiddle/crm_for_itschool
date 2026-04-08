-- Migration: Add Telegram verification fields to students table
ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone) WHERE deleted_at IS NULL;
