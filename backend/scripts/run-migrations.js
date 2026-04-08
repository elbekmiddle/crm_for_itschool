/**
 * Applies SQL files in backend/migrations/ in filename order.
 * Tracks applied files in schema_migrations (idempotent per file).
 *
 * Usage (from backend/): npm run db:migrate
 */
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let val = trimmed.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const backendRoot = path.join(__dirname, '..');
loadEnvFile(path.join(backendRoot, '.env'));

const MIGRATIONS_DIR = path.join(backendRoot, 'migrations');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(512) NOT NULL UNIQUE,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

async function getAppliedNames(client) {
  const { rows } = await client.query('SELECT name FROM schema_migrations');
  return new Set(rows.map((r) => r.name));
}

async function main() {
  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const client = await pool.connect();
  try {
    await ensureMigrationsTable(client);
    const applied = await getAppliedNames(client);

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`skip (already applied): ${file}`);
        continue;
      }
      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, 'utf8');
      console.log(`apply: ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [file]);
        await client.query('COMMIT');
        console.log(`ok: ${file}`);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error(`failed: ${file}`, e.message);
        throw e;
      }
    }
  } finally {
    client.release();
    await pool.end();
  }

  console.log('Migrations finished.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
