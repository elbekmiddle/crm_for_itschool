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
  
  console.log('--- EXAMS STATUS ---');
  const exams = await client.query('SELECT id, title, status, course_id FROM exams LIMIT 5');
  console.log(exams.rows);

  console.log('\n--- STUDENT GROUPS AND THEIR COURSES ---');
  const studentGroups = await client.query(`
    SELECT gs.group_id, g.course_id, g.name as group_name, c.name as course_name
    FROM group_students gs
    JOIN groups g ON gs.group_id = g.id
    JOIN courses c ON g.course_id = c.id
    WHERE gs.student_id = $1
  `, [studentId]);
  console.log(studentGroups.rows);

  const courseId = studentGroups.rows[0]?.course_id;
  console.log('\n--- EXAMS IN THAT COURSE ---');
  if (courseId) {
    const e = await client.query('SELECT count(*) FROM exams WHERE course_id = $1 AND status = \'published\'', [courseId]);
    console.log('Published exams in course:', e.rows[0].count);
  }

  await client.end();
}

run();
