
const { Client } = require('pg');
const bcrypt = require('bcrypt');

async function reset() {
  const hash = await bcrypt.hash('webdev20091', 10);
  const client = new Client({
    user: 'postgres',
    host: 'localhost',
    database: 'it_school_crm',
    password: 'webdev20091',
    port: 5432,
  });
  await client.connect();
  await client.query("UPDATE users SET password = $1 WHERE email = 'admin@school.com'", [hash]);
  console.log('Password reset successfully');
  await client.end();
}

reset().catch(console.error);
