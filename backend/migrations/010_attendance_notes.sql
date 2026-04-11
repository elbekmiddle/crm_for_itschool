-- Optional notes on attendance rows (schema was missing this column; API selected a.notes)
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS notes TEXT;
