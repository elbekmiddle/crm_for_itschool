import { DbService } from '../../../infrastructure/database/db.service';

export async function student_analytics_data(dbService: DbService, studentId: string) {
  const studentCheck = await dbService.query(`SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`, [studentId]);
  if (!studentCheck.length) return null;
  const student = studentCheck[0];

  const presence = await dbService.query(
    `SELECT status, COUNT(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`,
    [studentId]
  );

  const attendanceHistory = await dbService.query(
    `SELECT a.status, l.title as lesson_title, a.created_at 
     FROM attendance a 
     JOIN lessons l ON a.lesson_id = l.id 
     WHERE a.student_id = $1 
     ORDER BY a.created_at DESC`,
    [studentId]
  );

  const payments = await dbService.query(
    `SELECT amount, paid_at FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
    [studentId]
  );

  const exams = await dbService.query(
    `SELECT e.title, er.score, er.submitted_at 
     FROM exam_results er 
     JOIN exams e ON er.exam_id = e.id 
     WHERE er.student_id = $1 
     ORDER BY er.submitted_at DESC`,
    [studentId]
  );

  return {
    student,
    presence,
    attendanceHistory,
    payments,
    exams
  };
}
