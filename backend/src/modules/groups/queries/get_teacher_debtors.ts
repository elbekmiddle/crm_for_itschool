import { DbService } from '../../../infrastructure/database/db.service';

export async function get_teacher_debtors(dbService: DbService, teacherId: string) {
  // A student is a debtor if they haven't paid for a course for more than 1 month (approx 30 days)
  // Or more simply, if their last payment was more than 30 days ago and they are still in the group.
  return dbService.query(
    `SELECT s.id, s.first_name, s.last_name, s.phone, g.name as group_name, c.name as course_name,
            (SELECT MAX(paid_at) FROM payments p WHERE p.student_id = s.id AND p.course_id = g.course_id) as last_payment_date
     FROM students s
     JOIN group_students gs ON s.id = gs.student_id
     JOIN groups g ON gs.group_id = g.id
     JOIN courses c ON g.course_id = c.id
     WHERE g.teacher_id = $1
       AND (
         (SELECT MAX(paid_at) FROM payments p WHERE p.student_id = s.id AND p.course_id = g.course_id) < NOW() - INTERVAL '1 month'
         OR (SELECT MAX(paid_at) FROM payments p WHERE p.student_id = s.id AND p.course_id = g.course_id) IS NULL
       )`,
    [teacherId]
  );
}
