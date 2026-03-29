import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_dashboard(dbService: DbService, studentId: string) {
  const student = await dbService.query(
    `SELECT s.*, 
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'PRESENT') as present_days,
            (SELECT COUNT(*) FROM attendance WHERE student_id = s.id AND status = 'ABSENT') as absent_days
     FROM students s 
     WHERE s.id = $1`,
    [studentId]
  );

  if (!student.length) return null;

  const courses = await dbService.query(
    `SELECT c.name as course_name, c.id as course_id, sc.joined_at, cl.name as current_level
     FROM student_courses sc
     JOIN courses c ON sc.course_id = c.id
     LEFT JOIN course_levels cl ON sc.current_level_id = cl.id
     WHERE sc.student_id = $1`,
    [studentId]
  );

  const groups = await dbService.query(
    `SELECT g.name as group_name, g.id as group_id, gs.joined_at
     FROM group_students gs
     JOIN groups g ON gs.group_id = g.id
     WHERE gs.student_id = $1`,
    [studentId]
  );

  const payments = await dbService.query(
    `SELECT amount, paid_at, course_id 
     FROM payments 
     WHERE student_id = $1 
     ORDER BY paid_at DESC`,
    [studentId]
  );

  const attendance_history = await dbService.query(
    `SELECT lesson_date, status 
     FROM attendance 
     WHERE student_id = $1 
     ORDER BY lesson_date DESC 
     LIMIT 30`,
    [studentId]
  );

  return {
    ...student[0],
    courses,
    groups,
    payments,
    attendance_trend: attendance_history
  };
}
