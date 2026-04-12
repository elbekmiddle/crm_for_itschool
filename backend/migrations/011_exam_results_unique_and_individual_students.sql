-- Bir talaba uchun bir imtihon bo'yicha bitta `exam_results` qatori (grade_exam ON CONFLICT uchun).
DELETE FROM exam_results a
USING exam_results b
WHERE a.exam_id = b.exam_id
  AND a.student_id = b.student_id
  AND a.id < b.id;

DO $$
BEGIN
  ALTER TABLE exam_results
    ADD CONSTRAINT uq_exam_results_exam_student UNIQUE (exam_id, student_id);
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Alohida ro'yxatdagi talabalar (bootstrap'dan migratsiyaga ko'chirildi)
CREATE TABLE IF NOT EXISTS exam_individual_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_individual_students_exam ON exam_individual_students(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_individual_students_student ON exam_individual_students(student_id);
