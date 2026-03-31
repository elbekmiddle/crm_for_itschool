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

const fs = require('fs');
const path = require('path');

const runMigration = async () => {
  const sqlFile = path.join(__dirname, 'database', 'fix_missing_cols.sql');
  const migrationSql = fs.readFileSync(sqlFile, 'utf8');

  console.log('🔄 Running migration from:', sqlFile);
  try {
    await pool.query(migrationSql);
    console.log('✅ Migration applied successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await pool.end();
  }
};
runMigration();
