-- Database Schema Initialization
-- Automatically runs on container startup via entrypoint

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================
-- 1. BASE TABLES
-- ==========================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT,
    last_name TEXT,
    avatar_url TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'TEACHER', -- ADMIN, MANAGER, TEACHER
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, group_id)
);

CREATE TABLE IF NOT EXISTS lessons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- PRESENT, ABSENT
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(student_id, lesson_id)
);

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    group_id UUID REFERENCES groups(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    paid_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    level TEXT NOT NULL, -- easy, medium, hard
    text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE(exam_id, question_id)
);

CREATE TABLE IF NOT EXISTS exam_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    score NUMERIC(5, 2) NOT NULL,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    UNIQUE(exam_id, student_id)
);


-- ==========================
-- 2. HISTORY TABLES
-- ==========================

CREATE TABLE IF NOT EXISTS payments_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id UUID,
    student_id UUID,
    group_id UUID,
    amount NUMERIC(10, 2),
    paid_at TIMESTAMP,
    action TEXT NOT NULL, -- INSERT, UPDATE, DELETE
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attendance_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    attendance_id UUID,
    group_id UUID,
    student_id UUID,
    lesson_id UUID,
    status TEXT,
    action TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- 3. AUDIT LOG TABLE
-- ==========================

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL, -- table name basically
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ==========================
-- 4. INDEXES
-- ==========================

CREATE INDEX IF NOT EXISTS idx_student ON students(id);
CREATE INDEX IF NOT EXISTS idx_group ON groups(id);
CREATE INDEX IF NOT EXISTS idx_course ON courses(id);
CREATE INDEX IF NOT EXISTS idx_payment_date ON payments(paid_at);
CREATE INDEX IF NOT EXISTS idx_attendance_group ON attendance(group_id);


-- ==========================
-- 5. TRIGGERS (Auto History)
-- ==========================

-- Trigger Function for payments_history
CREATE OR REPLACE FUNCTION log_payment_history() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
         INSERT INTO payments_history (payment_id, student_id, group_id, amount, paid_at, action)
         VALUES (NEW.id, NEW.student_id, NEW.group_id, NEW.amount, NEW.paid_at, 'INSERT');
         RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
         INSERT INTO payments_history (payment_id, student_id, group_id, amount, paid_at, action)
         VALUES (NEW.id, NEW.student_id, NEW.group_id, NEW.amount, NEW.paid_at, 'UPDATE');
         RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
         INSERT INTO payments_history (payment_id, student_id, group_id, amount, paid_at, action)
         VALUES (OLD.id, OLD.student_id, OLD.group_id, OLD.amount, OLD.paid_at, 'DELETE');
         RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_payment_history ON payments;
CREATE TRIGGER trg_payment_history
AFTER INSERT OR UPDATE OR DELETE ON payments
FOR EACH ROW EXECUTE FUNCTION log_payment_history();

-- Trigger Function for attendance_history
CREATE OR REPLACE FUNCTION log_attendance_history() RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_id, status, action)
         VALUES (NEW.id, NEW.group_id, NEW.student_id, NEW.lesson_id, NEW.status, 'INSERT');
         RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_id, status, action)
         VALUES (NEW.id, NEW.group_id, NEW.student_id, NEW.lesson_id, NEW.status, 'UPDATE');
         RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_id, status, action)
         VALUES (OLD.id, OLD.group_id, OLD.student_id, OLD.lesson_id, OLD.status, 'DELETE');
         RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attendance_history ON attendance;
CREATE TRIGGER trg_attendance_history
AFTER INSERT OR UPDATE OR DELETE ON attendance
FOR EACH ROW EXECUTE FUNCTION log_attendance_history();