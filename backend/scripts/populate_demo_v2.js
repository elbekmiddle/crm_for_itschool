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
  const courseId = '22222222-2222-2222-2222-222222222222'; // Frontend Web
  const groupId = '44444444-4444-4444-4444-444444444444'; // FN-1
  const adminId = '11111111-1111-1111-1111-111111111111'; // Main Admin

  // 1. Ensure student is enrolled
  await client.query(`
    INSERT INTO student_courses (student_id, course_id, status)
    VALUES ($1, $2, 'active')
    ON CONFLICT DO NOTHING
  `, [studentId, courseId]);

  await client.query(`
    INSERT INTO group_students (student_id, group_id)
    VALUES ($1, $2)
    ON CONFLICT DO NOTHING
  `, [studentId, groupId]);

  console.log('Student enrolled and grouped');

  // 2. Create 10 Exams
  const examSubjects = [
    'HTML & CSS Asoslari',
    'JavaScript ES6+ Fundamental',
    'React.js Components & Hooks',
    'TypeScript Basics for Frontend',
    'Node.js & Express API Development',
    'PostgreSQL Database Design',
    'Advanced React State Management (Redux/Zustand)',
    'Next.js Fullstack Framework',
    'Tailwind CSS & Responsive Design',
    'Frontend Optimization & Performance'
  ];

  for (let i = 0; i < examSubjects.length; i++) {
    const examName = examSubjects[i];
    const examRes = await client.query(`
      INSERT INTO exams (title, course_id, status, created_by, duration_minutes)
      VALUES ($1, $2, 'published', $3, 60)
      RETURNING id
    `, [examName, courseId, adminId]);
    
    const examId = examRes.rows[0].id;

    // Create 10 questions for each exam
    for (let j = 1; j <= 10; j++) {
      const options = JSON.stringify(['Variant A', 'Variant B', 'Variant C', 'Variant D']);
      const correctAnswer = JSON.stringify('Variant A');
      const qRes = await client.query(`
        INSERT INTO questions (text, level, options, correct_answer, status, created_by)
        VALUES ($1, 'basic', $2, $3, 'published', $4)
        RETURNING id
      `, [`${examName} - Savol ${j}`, options, correctAnswer, adminId]);
      
      const questionId = qRes.rows[0].id;

      await client.query(`
        INSERT INTO exam_questions (exam_id, question_id)
        VALUES ($1, $2)
      `, [examId, questionId]);
    }
  }
  console.log('10 Exams with questions created');

  // 3. Attendance for student (8 PRESENT, 2 ABSENT)
  const today = new Date();
  for (let i = 0; i < 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const status = i < 8 ? 'PRESENT' : 'ABSENT';
    await client.query(`
      INSERT INTO attendance (student_id, group_id, status, lesson_date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (student_id, lesson_date) DO UPDATE SET status = EXCLUDED.status
    `, [studentId, groupId, status, date]);
  }
  console.log('Attendance records created');

  // 4. Some exam results for student
  const exams = (await client.query(`SELECT id FROM exams WHERE course_id = $1 LIMIT 5`, [courseId])).rows;
  for (let i = 0; i < exams.length; i++) {
    const score = 70 + Math.floor(Math.random() * 30);
    await client.query(`
      INSERT INTO exam_results (student_id, exam_id, score, started_at, finished_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (exam_id, student_id) DO UPDATE SET score = EXCLUDED.score
    `, [studentId, exams[i].id, score]);
  }
  console.log('Exam results created');

  // 5. Notifications
  const notifs = [
    { title: 'Yangi Imtihon', message: "Siz uchun 'React.js' imtihoni ochildi." },
    { title: 'To\'lov tasdiqlandi', message: "Fevral oyi uchun to'lov qabul qilindi." },
    { title: 'Davomat ogohlantirishi', message: "Sizda 2 ta sababsiz dars qoldirish bor." },
    { title: 'Yangi Kurs Materiali', message: "Advanced Hooks darsligi yuklandi." },
    { title: 'Sertifikat tayyor', message: "HTML/CSS kursi bo'yicha sertifikatingizni yuklab oling." }
  ];

  for (const n of notifs) {
    await client.query(`
      INSERT INTO notifications (student_id, title, message, is_read, created_at)
      VALUES ($1, $2, $3, false, NOW())
    `, [studentId, n.title, n.message]);
  }
  console.log('Notifications created');

  await client.end();
  console.log('Demo data population complete!');
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
