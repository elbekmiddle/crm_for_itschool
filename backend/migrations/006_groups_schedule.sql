-- Dars jadvali matni (kunlar + vaqt); AI imtihon konteksti ham ishlatadi
ALTER TABLE groups ADD COLUMN IF NOT EXISTS schedule TEXT;
