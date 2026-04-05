
const { Client } = require('pg');

async function populate() {
  const client = new Client({
    user: 'postgres', host: 'localhost', database: 'it_school_crm', password: 'webdev20091', port: 5432
  });
  await client.connect();

  const studentId = '737ae1c8-4b73-49b3-a431-f8a517b84031';
  const groupId = '55555555-5555-5555-5555-555555555555'; // BN-1

  console.log('Enrolling student in group...');
  try {
    await client.query(`
      INSERT INTO group_students (group_id, student_id)
      VALUES ($1, $2)
      ON CONFLICT DO NOTHING`,
      [groupId, studentId]
    );
  } catch (e) {
    console.warn('Enrolling warn:', e.message);
  }

  console.log('Adding demo attendance...');
  for (let i = 0; i < 20; i++) {
    const isPresent = i < 16; // 80% (16/20)
    try {
        await client.query(`
            INSERT INTO attendance (group_id, student_id, lesson_date, status)
            VALUES ($1, $2, NOW() - interval '${i} days', $3)`,
            [groupId, studentId, isPresent ? 'PRESENT' : 'ABSENT']
        );
    } catch (e) {
        console.warn('Attendance warn:', e.message);
    }
  }

  console.log('Adding demo payments...');
  try {
    const courseRes = await client.query('SELECT id FROM courses LIMIT 1');
    const courseId = courseRes.rows[0].id;
    await client.query(`
      INSERT INTO payments (student_id, course_id, amount, paid_at)
      VALUES ($1, $2, $3, NOW() - interval '10 days'),
             ($1, $2, $4, NOW() - interval '2 month')`,
      [studentId, courseId, 800000, 1200000]
    );
  } catch (e) {
    console.warn('Payment warn:', e.message);
  }

  console.log('Demo data populated for +998976637200');
  await client.end();
}

populate().catch(console.error);
