-- Migration: Create Exam System Tables
-- Date: 2026-04-05
-- Description: Creates all necessary tables for the exam platform

-- =============================================
-- EXAMS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER NOT NULL DEFAULT 60,
    passing_score INTEGER NOT NULL DEFAULT 60,
    total_points INTEGER NOT NULL DEFAULT 100,
    status VARCHAR(50) NOT NULL DEFAULT 'draft', -- draft, published, archived
    shuffle_questions BOOLEAN DEFAULT TRUE,
    show_answers_feedback BOOLEAN DEFAULT TRUE,
    allow_review BOOLEAN DEFAULT TRUE,
    hide_correct_answers BOOLEAN DEFAULT FALSE,
    randomize_answer_order BOOLEAN DEFAULT TRUE,
    enable_anti_cheat BOOLEAN DEFAULT TRUE,
    max_attempts INTEGER DEFAULT 1,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    start_time TIME,
    end_time TIME,
    instructions TEXT,
    time_warning_minutes INTEGER DEFAULT 5,
    allow_calculator BOOLEAN DEFAULT FALSE,
    allow_notes BOOLEAN DEFAULT FALSE,
    show_progress_bar BOOLEAN DEFAULT TRUE,
    show_timer BOOLEAN DEFAULT TRUE,
    allow_back_tracking BOOLEAN DEFAULT TRUE,
    lock_questions BOOLEAN DEFAULT FALSE,
    proctor_required BOOLEAN DEFAULT FALSE,
    record_session BOOLEAN DEFAULT FALSE,
    verify_identity BOOLEAN DEFAULT FALSE,
    full_screen_required BOOLEAN DEFAULT FALSE,
    webcam_required BOOLEAN DEFAULT FALSE,
    microphone_required BOOLEAN DEFAULT FALSE,
    notification_email VARCHAR(255),
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_exams_course_id ON exams(course_id);
CREATE INDEX idx_exams_status ON exams(status);
CREATE INDEX idx_exams_created_by ON exams(created_by);
CREATE INDEX idx_exams_created_at ON exams(created_at);

-- =============================================
-- QUESTIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id),
    type VARCHAR(50) NOT NULL, -- select, text, code
    text TEXT NOT NULL,
    options JSONB, -- For select type
    correct_answer JSONB,
    code_template TEXT, -- For code type
    test_cases JSONB, -- For code type
    points INTEGER DEFAULT 10,
    level VARCHAR(50), -- easy, medium, hard
    created_by UUID NOT NULL REFERENCES users(id),
    status VARCHAR(50) DEFAULT 'draft', -- draft, active, archived
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

CREATE INDEX idx_questions_lesson_id ON questions(lesson_id);
CREATE INDEX idx_questions_type ON questions(type);
CREATE INDEX idx_questions_created_by ON questions(created_by);

-- =============================================
-- EXAM_QUESTIONS (Many-to-Many)
-- =============================================
CREATE TABLE IF NOT EXISTS exam_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    question_order INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(exam_id, question_id)
);

CREATE INDEX idx_exam_questions_exam_id ON exam_questions(exam_id);
CREATE INDEX idx_exam_questions_question_id ON exam_questions(question_id);

-- =============================================
-- EXAM_ATTEMPTS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'in_progress', -- in_progress, submitted, graded
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    attempts_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_attempts_exam_id ON exam_attempts(exam_id);
CREATE INDEX idx_exam_attempts_student_id ON exam_attempts(student_id);
CREATE INDEX idx_exam_attempts_status ON exam_attempts(status);

-- =============================================
-- ATTEMPT_ANSWERS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS attempt_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    answer JSONB, -- Can be string, array, or code
    is_correct BOOLEAN,
    points_earned INTEGER,
    time_spent INTEGER, -- in seconds
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(attempt_id, question_id)
);

CREATE INDEX idx_attempt_answers_attempt_id ON attempt_answers(attempt_id);
CREATE INDEX idx_attempt_answers_question_id ON attempt_answers(question_id);

-- =============================================
-- EXAM_RESULTS TABLE
-- =============================================
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
    time_taken INTEGER, -- in seconds
    violations_count INTEGER DEFAULT 0,
    graded_by UUID REFERENCES users(id),
    graded_at TIMESTAMP,
    feedback TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_exam_results_exam_id ON exam_results(exam_id);
CREATE INDEX idx_exam_results_student_id ON exam_results(student_id);
CREATE INDEX idx_exam_results_passed ON exam_results(passed);

-- =============================================
-- ANTI_CHEAT_VIOLATIONS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS anti_cheat_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES exam_attempts(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id),
    violation_type VARCHAR(100) NOT NULL, -- tab_switch, copy_paste, right_click, etc
    severity VARCHAR(50), -- warning, critical
    description TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_violations_attempt_id ON anti_cheat_violations(attempt_id);
CREATE INDEX idx_violations_student_id ON anti_cheat_violations(student_id);
CREATE INDEX idx_violations_timestamp ON anti_cheat_violations(timestamp);

-- =============================================
-- AI_GENERATION_JOBS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS ai_generation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    level VARCHAR(50),
    count INTEGER NOT NULL,
    status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
    progress INTEGER DEFAULT 0,
    generated_questions JSONB,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_ai_jobs_exam_id ON ai_generation_jobs(exam_id);
CREATE INDEX idx_ai_jobs_status ON ai_generation_jobs(status);

-- =============================================
-- EXAM_ANALYTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL UNIQUE REFERENCES exams(id) ON DELETE CASCADE,
    total_students INTEGER DEFAULT 0,
    total_attempts INTEGER DEFAULT 0,
    average_score NUMERIC(5,2) DEFAULT 0,
    pass_rate NUMERIC(5,2) DEFAULT 0,
    fail_rate NUMERIC(5,2) DEFAULT 0,
    average_time_spent INTEGER DEFAULT 0,
    highest_score NUMERIC(5,2) DEFAULT 0,
    lowest_score NUMERIC(5,2) DEFAULT 0,
    standard_deviation NUMERIC(5,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_analytics_exam_id ON exam_analytics(exam_id);

-- =============================================
-- EXAM_SETTINGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS exam_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL UNIQUE REFERENCES exams(id) ON DELETE CASCADE,
    ip_restrictions JSONB, -- Array of IP ranges
    allowed_devices JSONB,
    security_level VARCHAR(50) DEFAULT 'medium', -- low, medium, high
    proctoring_config JSONB,
    notification_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =============================================
-- QUESTION_STATISTICS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS question_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    total_answered INTEGER DEFAULT 0,
    correct_count INTEGER DEFAULT 0,
    incorrect_count INTEGER DEFAULT 0,
    correct_rate NUMERIC(5,2) DEFAULT 0,
    average_time_spent INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(question_id, exam_id)
);

CREATE INDEX idx_question_stats_question_id ON question_statistics(question_id);
CREATE INDEX idx_question_stats_exam_id ON question_statistics(exam_id);

-- =============================================
-- ALTER EXISTING TABLES (if needed)
-- =============================================

-- Add exam-related fields to users table if not exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS exam_proctor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_exams_created INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_exams_graded INTEGER DEFAULT 0;

-- Add fields to students table if not exists
ALTER TABLE students ADD COLUMN IF NOT EXISTS total_exams_taken INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS average_score NUMERIC(5,2) DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS exams_passed INTEGER DEFAULT 0;
ALTER TABLE students ADD COLUMN IF NOT EXISTS exams_failed INTEGER DEFAULT 0;

-- =============================================
-- CREATE VIEWS
-- =============================================

-- View for exam performance summary
CREATE OR REPLACE VIEW exam_performance_summary AS
SELECT
    ea.exam_id,
    e.title as exam_title,
    ea.total_students,
    ea.total_attempts,
    ea.average_score,
    ea.pass_rate,
    ea.fail_rate,
    ea.average_time_spent,
    COUNT(DISTINCT er.student_id) as unique_students
FROM exam_analytics ea
JOIN exams e ON ea.exam_id = e.id
LEFT JOIN exam_results er ON ea.exam_id = er.exam_id
GROUP BY ea.exam_id, e.title, ea.total_students, ea.total_attempts, 
         ea.average_score, ea.pass_rate, ea.fail_rate, ea.average_time_spent;

-- View for student exam history
CREATE OR REPLACE VIEW student_exam_history AS
SELECT
    s.id as student_id,
    s.first_name || ' ' || s.last_name as student_name,
    e.id as exam_id,
    e.title as exam_title,
    er.score,
    er.passed,
    er.time_taken,
    er.created_at as attempt_date,
    ROW_NUMBER() OVER (PARTITION BY s.id, e.id ORDER BY er.created_at DESC) as attempt_number
FROM students s
JOIN exam_results er ON s.id = er.student_id
JOIN exams e ON er.exam_id = e.id;

-- =============================================
-- GRANTS (Adjust roles as needed)
-- =============================================

-- GRANT USAGE ON SCHEMA public TO app_user;
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO app_user;

COMMIT;
