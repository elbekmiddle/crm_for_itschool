// Add Telegram user info columns to students table
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' });

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'it_school_crm',
});

const sql = `
  ALTER TABLE students
    ADD COLUMN IF NOT EXISTS telegram_username   TEXT,
    ADD COLUMN IF NOT EXISTS telegram_first_name TEXT,
    ADD COLUMN IF NOT EXISTS telegram_last_name  TEXT,
    ADD COLUMN IF NOT EXISTS telegram_linked_at  TIMESTAMPTZ;
`;

pool.query(sql)
  .then(() => { console.log('✅ Telegram user columns added to students table'); pool.end(); })
  .catch(e => { console.error('❌', e.message); pool.end(); });
