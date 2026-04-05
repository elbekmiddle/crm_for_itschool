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
  console.log('Connected to DB');

  const studentId = '737ae1c8-4b73-49b3-a431-f8a517b84031';
  const beCourseId = '33333333-3333-3333-3333-333333333333'; // Backend NestJS
  const beGroupId = '55555555-5555-5555-5555-555555555555'; // BN-1
  const adminId = '11111111-1111-1111-1111-111111111111'; // Main Admin

  // 1. Ensure user exists for student (foreign key constraint)
  await client.query(`
    INSERT INTO users (id, email, password, role, first_name, last_name, phone)
    VALUES ($1, 'student@school.com', '$2b$10$wT0H2Nn3lA.Wz2y7Rk6dOO.Z/sKj2x4M1C7T2H3L4G5H6I7J8K9L', 'STUDENT', 'ELbek', 'Rustamjanov', '+998976637200')
    ON CONFLICT (id) DO UPDATE SET role = 'STUDENT', phone = '+998976637200'
  `, [studentId]);
  console.log('User record ensured for student');

  // 2. Update Student Profile
  await client.query(`
    UPDATE students 
    SET parent_name = 'Rustamov Jamshid', parent_phone = '+998901234567'
    WHERE id = $1
  `, [studentId]);
  console.log('Student profile updated (parent info)');

  // 2. Handle active courses
  await client.query(`UPDATE student_courses SET status = 'transferred' WHERE student_id = $1 AND course_id != $2`, [studentId, beCourseId]);
  
  await client.query(`
    INSERT INTO student_courses (student_id, course_id, status, started_at)
    VALUES ($1, $2, 'active', NOW())
    ON CONFLICT (student_id, course_id) DO UPDATE SET status = 'active'
  `, [studentId, beCourseId]);
  console.log('Student set to active in Backend course');

  // 3. Create Backend Exams
  const subjects = ['Node.js Fundamentals','NestJS Architecture','PostgreSQL & Prisma','JWT Auth','Microservices'];
  for (const name of subjects) {
    const res = await client.query(`
      INSERT INTO exams (title, course_id, status, created_by, duration_minutes)
      VALUES ($1, $2, 'published', $3, 60)
      ON CONFLICT DO NOTHING RETURNING id
    `, [name, beCourseId, adminId]);
    
    if (res.rowCount > 0) {
      const examId = res.rows[0].id;
      for (let j = 1; j <= 5; j++) {
        const options = JSON.stringify(['A', 'B', 'C', 'D']);
        const qRes = await client.query(`
          INSERT INTO questions (text, level, options, correct_answer, status, created_by)
          VALUES ($1, 'basic', $2, '"A"', 'published', $3) RETURNING id
        `, [`${name} Q${j}`, options, adminId]);
        await client.query(`INSERT INTO exam_questions (exam_id, question_id) VALUES ($1, $2)`, [examId, qRes.rows[0].id]);
      }
    }
  }
  console.log('Backend Exams created');

  // 4. Notifications & Payments
  await client.query(`DELETE FROM notifications WHERE student_id = $1`, [studentId]);
  await client.query(`INSERT INTO notifications (student_id, title, message) VALUES ($1, 'Xush kelibsiz', 'Backend kursiga xush kelibsiz!')`, [studentId]);
  
  await client.query(`DELETE FROM payments WHERE student_id = $1`, [studentId]);
  await client.query(`INSERT INTO payments (student_id, course_id, amount, paid_at) VALUES ($1, $2, 1200000, NOW() - INTERVAL '10 days')`, [studentId, beCourseId]);
  console.log('Final data updated');

  await client.end();
}

run().catch(console.error);
