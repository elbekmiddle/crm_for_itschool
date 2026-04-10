-- Eski bazalar bilan Nest kodining mosligi: yo‘q ustunlarni qo‘shadi.
-- Xavfsiz takrorlanadi (IF NOT EXISTS).

-- Imtihon vaqti (kod `time_limit` ni kutadi; migratsiya 002 da `duration_minutes` bor)
ALTER TABLE exams ADD COLUMN IF NOT EXISTS time_limit INTEGER;
UPDATE exams SET time_limit = COALESCE(time_limit, duration_minutes, 60);

-- Urinish: muddat / topshirish / ball (baʼzi eski sxemalarda yo‘q)
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS deadline_at TIMESTAMP;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS finished_at TIMESTAMP;
ALTER TABLE exam_attempts ADD COLUMN IF NOT EXISTS score NUMERIC(5,2);

-- Natija: tartib maydoni (002 da `created_at` bor; kod `submitted_at` ishlatadi)
ALTER TABLE exam_results ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMP;
UPDATE exam_results SET submitted_at = COALESCE(submitted_at, created_at) WHERE submitted_at IS NULL;

-- To‘lovlar: kurs bog‘lanishi (ixtiyoriy)
ALTER TABLE payments ADD COLUMN IF NOT EXISTS course_id UUID REFERENCES courses(id) ON DELETE SET NULL;
