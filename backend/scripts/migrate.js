const { Pool } = require('pg');
require('dotenv').config({ path: 'backend/.env' });

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const migrationQuery = `
CREATE TABLE IF NOT EXISTS course_levels (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    name         TEXT NOT NULL,
    level_order  INTEGER NOT NULL DEFAULT 1,
    description  TEXT,
    min_pass_score NUMERIC(5,2) NOT NULL DEFAULT 60.0,
    created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(course_id, level_order)
);

-- Fix student_courses columns
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_courses' AND column_name='current_level_id') THEN
        ALTER TABLE student_courses ADD COLUMN current_level_id UUID REFERENCES course_levels(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='student_courses' AND column_name='level_upgraded_at') THEN
        ALTER TABLE student_courses ADD COLUMN level_upgraded_at TIMESTAMP;
    END IF;
END $$;
`;

async function runMigration() {
  try {
    console.log('Running final schema fix...');
    await pool.query(migrationQuery);
    console.log('Migration successful!');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await pool.end();
  }
}

runMigration();
