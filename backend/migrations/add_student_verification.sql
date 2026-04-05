-- Migration: Add Telegram verification fields to students table
-- Run this SQL against your PostgreSQL database

ALTER TABLE students
  ADD COLUMN IF NOT EXISTS password TEXT,
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

-- Index for faster phone lookups  
CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone) WHERE deleted_at IS NULL;

-- Update existing students: mark them as verified if they already have access
-- (Optional — remove if you want everyone to go through the verification flow)
-- UPDATE students SET is_verified = true WHERE password IS NOT NULL;
