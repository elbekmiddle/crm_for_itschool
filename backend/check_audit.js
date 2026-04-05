
const { Client } = require('pg');

async function check() {
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'it_school_crm',
    password: 'webdev20091',
    port: 5432,
  });
  await client.connect();
  const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'audit_logs'");
  console.log('Columns:', JSON.stringify(res.rows, null, 2));
  await client.end();
}

check().catch(console.error);
