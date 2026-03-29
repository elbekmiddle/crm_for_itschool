const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'webdev20091',
  database: 'it_school_crm',
});
client.connect().then(() => client.query("SELECT id, email, password FROM users WHERE email='admin@school.com'"))
.then(res => { 
  console.log('DB Users:', res.rows); 
  client.end();
})
.catch(err => {
  console.error('DB Error:', err.message);
  process.exit(1);
});
