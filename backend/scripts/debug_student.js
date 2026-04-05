const { Client } = require('pg');

const client = new Client({
  user: 'postgres',
  host: 'localhost',
  database: 'it_school_crm',
  password: 'webdev20091',
  port: 5432,
});

async function run() {
  await client.connect();
  const studentId = '737ae1c8-4b73-49b3-a431-f8a517b84031';
  
  console.log('--- STUDENT INFO ---');
  const res = await client.query('SELECT * FROM students WHERE id = $1', [studentId]);
  console.log(res.rows[0]);

  console.log('\n--- ENROLLMENTS ---');
  const enr = await client.query('SELECT * FROM student_courses WHERE student_id = $1', [studentId]);
  console.log(enr.rows);

  console.log('\n--- GROUPS ---');
  const groups = await client.query('SELECT * FROM group_students WHERE student_id = $1', [studentId]);
  console.log(groups.rows);

  console.log('\n--- AVAILABLE EXAMS QUERY TEST ---');
  const exams = await client.query(`
      SELECT 
        e.id, e.title, e.status, e.course_id
      FROM exams e
      JOIN courses c ON e.course_id = c.id
      JOIN groups g ON g.course_id = c.id
      JOIN group_students gs ON gs.group_id = g.id
      WHERE gs.student_id = $1
      AND e.status = 'published'
  `, [studentId]);
  console.log('Count:', exams.rowCount);
  if (exams.rowCount > 0) console.log('Sample:', exams.rows[0]);

  console.log('\n--- PAYMENTS ---');
  const payments = await client.query('SELECT * FROM payments WHERE student_id = $1', [studentId]);
  console.log(payments.rows);

  await client.end();
}

run();
