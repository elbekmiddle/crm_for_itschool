
const { Client } = require('pg');
const bcrypt = require('bcrypt');
const fs = require('fs');
const path = require('path');

function loadEnv() {
  const envPath = path.resolve(__dirname, '../.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        let key = match[1].trim();
        let val = match[2].trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
}

async function setup() {
  loadEnv();

  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database.');

    // 1. Create Tables
    console.log('Creating tables if they do not exist...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT,
        last_name TEXT,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'TEACHER',
        phone TEXT,
        telegram_chat_id TEXT,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        exam_proctor_enabled BOOLEAN DEFAULT FALSE,
        total_exams_created INTEGER DEFAULT 0,
        total_exams_graded INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS courses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        price NUMERIC NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS lessons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS students (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        first_name TEXT NOT NULL,
        last_name TEXT,
        phone TEXT UNIQUE NOT NULL,
        password TEXT,
        is_verified BOOLEAN DEFAULT FALSE,
        telegram_chat_id TEXT,
        parent_name TEXT,
        parent_phone TEXT,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP,
        total_exams_taken INTEGER DEFAULT 0,
        average_score NUMERIC(5,2) DEFAULT 0,
        exams_passed INTEGER DEFAULT 0,
        exams_failed INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS groups (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
        teacher_id UUID REFERENCES users(id),
        capacity INTEGER DEFAULT 20,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS group_students (
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (group_id, student_id)
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
        lesson_date DATE NOT NULL,
        status TEXT NOT NULL, -- PRESENT, ABSENT
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id UUID REFERENCES students(id) ON DELETE CASCADE,
        group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
        amount NUMERIC NOT NULL,
        paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Exam system tables (from 002 migration)
      CREATE TABLE IF NOT EXISTS exams (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        duration_minutes INTEGER NOT NULL DEFAULT 60,
        passing_score INTEGER NOT NULL DEFAULT 60,
        total_points INTEGER NOT NULL DEFAULT 100,
        status VARCHAR(50) NOT NULL DEFAULT 'draft',
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lesson_id UUID REFERENCES lessons(id),
        type VARCHAR(50) NOT NULL,
        text TEXT NOT NULL,
        options JSONB,
        correct_answer JSONB,
        points INTEGER DEFAULT 10,
        level VARCHAR(50),
        created_by UUID NOT NULL REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exam_questions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
        question_order INTEGER,
        UNIQUE(exam_id, question_id)
      );

      CREATE TABLE IF NOT EXISTS exam_attempts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
        student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        status VARCHAR(50) NOT NULL DEFAULT 'in_progress',
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        submitted_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS exam_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
        exam_id UUID NOT NULL REFERENCES exams(id),
        student_id UUID NOT NULL REFERENCES students(id),
        score NUMERIC(5,2) NOT NULL,
        passed BOOLEAN NOT NULL,
        correct_count INTEGER NOT NULL,
        incorrect_count INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        time_taken INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- Backward-compatible columns for older users schema
      ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
      ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
    `);
    console.log('Tables created or updated.');

    const passwordHash = await bcrypt.hash('password123', 10);

    // 2. Clear Existing Data (Optional but recommended for a clean demo)
    console.log('Cleaning existing data for fresh demo...');
    await client.query('TRUNCATE users, courses, students, lessons, groups, group_students, attendance, payments, exams, questions, exam_questions, exam_attempts, exam_results CASCADE');

    // 3. Create Admins (4)
    console.log('Adding 4 Admins...');
    const admins = [];
    const mainAdminRes = await client.query(
        'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['admin@school.com', passwordHash, 'ADMIN', 'Main', 'Admin']
    );
    admins.push(mainAdminRes.rows[0].id);
    for (let i = 1; i <= 3; i++) {
        const res = await client.query(
            'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [`admin${i}@itschool.uz`, passwordHash, 'ADMIN', `Admin-${i}`, 'System']
        );
        admins.push(res.rows[0].id);
    }

    // 4. Create Manager (1)
    console.log('Adding 1 Manager...');
    const managerRes = await client.query(
        'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        ['manager@itschool.uz', passwordHash, 'MANAGER', 'Asror', 'Ergashev']
    );
    const managerId = managerRes.rows[0].id;

    // 5. Create Teachers (2)
    console.log('Adding 2 Teachers...');
    const teachers = [];
    for (let i = 1; i <= 2; i++) {
        const res = await client.query(
            'INSERT INTO users (email, password, role, first_name, last_name) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [`teacher${i}@itschool.uz`, passwordHash, 'TEACHER', `Teacher-${i}`, 'Fullstack']
        );
        teachers.push(res.rows[0].id);
    }

    // 6. Create Courses (4)
    console.log('Adding 4 Courses...');
    const courseData = [
        ['Frontend Development', 1200000],
        ['Backend (Node.js)', 1300000],
        ['Mobile (Flutter)', 1500000],
        ['UI/UX Design', 1000000]
    ];
    const courses = [];
    for (const [name, price] of courseData) {
        const res = await client.query('INSERT INTO courses (name, price) VALUES ($1, $2) RETURNING id, name', [name, price]);
        courses.push(res.rows[0]);
    }

    // 7. Create Lessons (2 for each course)
    console.log('Adding Lessons...');
    const lessons = [];
    for (const course of courses) {
        const l1 = await client.query('INSERT INTO lessons (course_id, title) VALUES ($1, $2) RETURNING id', [course.id, `${course.name} - Kirish`]);
        const l2 = await client.query('INSERT INTO lessons (course_id, title) VALUES ($1, $2) RETURNING id', [course.id, `${course.name} - Fundamentals`]);
        lessons.push({ id: l1.rows[0].id, course_id: course.id });
        lessons.push({ id: l2.rows[0].id, course_id: course.id });
    }

    // 8. Create Student (1)
    console.log('Adding 1 Student...');
    const studentRes = await client.query(
        `INSERT INTO students (first_name, last_name, phone, created_by) 
         VALUES ($1, $2, $3, $4) RETURNING id`,
        ['Jasur', 'Karimov', '+998971112233', admins[0]]
    );
    const studentId = studentRes.rows[0].id;

    // 9. Create Groups (4)
    console.log('Adding 4 Groups...');
    const groups = [];
    for (let i = 0; i < courses.length; i++) {
        const teacherId = i % 2 === 0 ? teachers[0] : teachers[1];
        const res = await client.query(
            'INSERT INTO groups (name, course_id, teacher_id) VALUES ($1, $2, $3) RETURNING id',
            [`Group-${i+1}`, courses[i].id, teacherId]
        );
        groups.push(res.rows[0].id);
    }

    // 10. Enroll student in groups
    console.log('Enrolling student...');
    for (const groupId of groups) {
        await client.query('INSERT INTO group_students (group_id, student_id) VALUES ($1, $2)', [groupId, studentId]);
    }

    // 11. Attendance
    console.log('Adding Attendance...');
    const groupsToMark = [groups[0], groups[1]];
    for (const groupId of groupsToMark) {
        const lesson = lessons.find(l => l.course_id === courses[groups.indexOf(groupId)].id);
        await client.query(
            'INSERT INTO attendance (group_id, student_id, lesson_id, lesson_date, status) VALUES ($1, $2, $3, $4, $5)',
            [groupId, studentId, lesson.id, new Date().toISOString().split('T')[0], 'PRESENT']
        );
    }

    // 12. Payments
    console.log('Adding Payments...');
    await client.query('INSERT INTO payments (student_id, group_id, amount) VALUES ($1, $2, $3)', [studentId, groups[0], 1200000]);
    await client.query('INSERT INTO payments (student_id, group_id, amount) VALUES ($1, $2, $3)', [studentId, groups[1], 500000]);

    // 13. Questions & Exams
    console.log('Adding Questions & Exams...');
    for (let i = 0; i < courses.length; i++) {
        const course = courses[i];
        const lesson = lessons.find(l => l.course_id === course.id);
        const examRes = await client.query(
            'INSERT INTO exams (course_id, title, status, created_by) VALUES ($1, $2, $3, $4) RETURNING id',
            [course.id, `${course.name} - Interim Exam`, 'published', teachers[i % 2]]
        );
        const examId = examRes.rows[0].id;

        const qRes = await client.query(
            `INSERT INTO questions (lesson_id, type, text, options, correct_answer, created_by) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
            [lesson.id, 'select', `What is the core of ${course.name}?`, JSON.stringify(['A', 'B', 'C']), JSON.stringify('A'), teachers[i % 2]]
        );
        await client.query('INSERT INTO exam_questions (exam_id, question_id, question_order) VALUES ($1, $2, $3)', [examId, qRes.rows[0].id, 1]);

        if (i === 0) { // Add score for the first exam
            const attemptRes = await client.query(
                'INSERT INTO exam_attempts (exam_id, student_id, status, submitted_at) VALUES ($1, $2, $3, NOW()) RETURNING id',
                [examId, studentId, 'graded']
            );
            await client.query(
                `INSERT INTO exam_results (attempt_id, exam_id, student_id, score, passed, correct_count, incorrect_count, total_questions) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
                [attemptRes.rows[0].id, examId, studentId, 90.0, true, 1, 0, 1]
            );
        }
    }

    console.log('--- DEMO DATA SEEDED SUCCESSFULLY ---');
    console.log('Login credentials:');
    console.log('- Admins: admin1@itschool.uz - admin3@itschool.uz / password123');
    console.log('- Manager: manager@itschool.uz / password123');
    console.log('- Teachers: teacher1@itschool.uz - teacher2@itschool.uz / password123');
    console.log('- Student: Jasur Karimov (+998971112233)');

  } catch (err) {
    console.error('Setup error:', err);
  } finally {
    await client.end();
  }
}

setup();
