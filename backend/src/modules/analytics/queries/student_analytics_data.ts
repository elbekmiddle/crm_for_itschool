import { DbService } from '../../../infrastructure/database/db.service';

export async function student_analytics_data(dbService: DbService, studentId: string) {
  const studentCheck = await dbService.query(`SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`, [studentId]);
  if (!studentCheck.length) return null;
  const student = studentCheck[0];

  let presence: any[] = [];
  try {
    presence = await dbService.query(
      `SELECT status, COUNT(*) as count FROM attendance WHERE student_id = $1 GROUP BY status`,
      [studentId],
    );
  } catch {
    presence = [];
  }

  let attendanceHistory: any[] = [];
  try {
    attendanceHistory = await dbService.query(
      `SELECT a.status, l.title as lesson_title, a.created_at 
       FROM attendance a 
       JOIN lessons l ON a.lesson_id = l.id 
       WHERE a.student_id = $1 
       ORDER BY a.created_at DESC`,
      [studentId],
    );
  } catch {
    try {
      attendanceHistory = await dbService.query(
        `SELECT status, NULL::text as lesson_title, created_at 
         FROM attendance 
         WHERE student_id = $1 
         ORDER BY created_at DESC NULLS LAST`,
        [studentId],
      );
    } catch {
      attendanceHistory = [];
    }
  }

  let payments: any[] = [];
  try {
    payments = await dbService.query(
      `SELECT amount, paid_at FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`,
      [studentId],
    );
  } catch {
    try {
      payments = await dbService.query(
        `SELECT * FROM payments WHERE student_id = $1 ORDER BY created_at DESC NULLS LAST`,
        [studentId],
      );
    } catch {
      payments = [];
    }
  }

  let exams: any[] = [];
  try {
    exams = await dbService.query(
      `SELECT e.title, er.score, COALESCE(er.submitted_at, er.created_at) AS submitted_at
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       WHERE er.student_id = $1
       ORDER BY COALESCE(er.submitted_at, er.created_at) DESC`,
      [studentId],
    );
  } catch {
    try {
      exams = await dbService.query(
        `SELECT e.title, er.score, er.created_at AS submitted_at
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         WHERE er.student_id = $1
         ORDER BY er.created_at DESC`,
        [studentId],
      );
    } catch {
      exams = [];
    }
  }

  return {
    student,
    presence,
    attendanceHistory,
    payments,
    exams,
  };
}
