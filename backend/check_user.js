
const { Client } = require('pg');
const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'it_school_crm',
  password: 'webdev20091',
  port: 5432,
});

async function check() {
  await client.connect();
  const res = await client.query("SELECT id, email, role, first_name, last_name, password FROM users WHERE email = 'admin@school.com'");
  console.log('User record:', JSON.stringify(res.rows[0], null, 2));
  await client.end();
}

check().catch(console.error);
