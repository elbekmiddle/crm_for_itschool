
-- Fix for attendance history trigger function
CREATE OR REPLACE FUNCTION log_attendance_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_date, status, action)
         VALUES (NEW.id, NEW.group_id, NEW.student_id, NEW.lesson_date, NEW.status, 'INSERT');
         RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_date, status, action)
         VALUES (NEW.id, NEW.group_id, NEW.student_id, NEW.lesson_date, NEW.status, 'UPDATE');
         RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
         INSERT INTO attendance_history (attendance_id, group_id, student_id, lesson_date, status, action)
         VALUES (OLD.id, OLD.group_id, OLD.student_id, OLD.lesson_date, OLD.status, 'DELETE');
         RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Fix for payment history trigger function
CREATE OR REPLACE FUNCTION log_payment_history()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
         INSERT INTO payments_history (payment_id, student_id, course_id, amount, paid_at, action)
         VALUES (NEW.id, NEW.student_id, NEW.course_id, NEW.amount, NEW.paid_at, 'INSERT');
         RETURN NEW;
    ELSIF (TG_OP = 'UPDATE') THEN
         INSERT INTO payments_history (payment_id, student_id, course_id, amount, paid_at, action)
         VALUES (NEW.id, NEW.student_id, NEW.course_id, NEW.amount, NEW.paid_at, 'UPDATE');
         RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
         INSERT INTO payments_history (payment_id, student_id, course_id, amount, paid_at, action)
         VALUES (OLD.id, OLD.student_id, OLD.course_id, OLD.amount, OLD.paid_at, 'DELETE');
         RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
