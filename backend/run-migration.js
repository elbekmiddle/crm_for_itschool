// Run: node run-migration.js
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'it_school_crm',
});

const migration = `
  ALTER TABLE students
    ADD COLUMN IF NOT EXISTS password TEXT,
    ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;

  CREATE INDEX IF NOT EXISTS idx_students_phone ON students(phone) WHERE deleted_at IS NULL;
`;

(async () => {
  console.log('🔄 Running migration...');
  try {
    await pool.query(migration);
    console.log('✅ Migration applied: password, is_verified, telegram_chat_id columns added to students table.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
})();
