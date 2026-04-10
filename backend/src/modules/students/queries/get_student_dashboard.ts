import { DbService } from '../../../infrastructure/database/db.service';

/**
 * Eski bazalarda yo‘q ustun/jadval (42703/42P01) bo‘lsa ham 503 bermaslik —
 * minimal so‘rovlar va fallback.
 */
export async function get_student_dashboard(dbService: DbService, studentId: string) {
  const student = await dbService.query(
    `SELECT s.* FROM students s WHERE s.id = $1 AND s.deleted_at IS NULL`,
    [studentId],
  );

  if (!student.length) return null;

  let present_days = 0;
  let absent_days = 0;
  try {
    const counts = await dbService.query(
      `SELECT 
        (SELECT COUNT(*)::int FROM attendance WHERE student_id = $1 AND UPPER(TRIM(COALESCE(status::text, ''))) = 'PRESENT') as p,
        (SELECT GREATEST((SELECT COUNT(*)::int FROM attendance WHERE student_id = $1) - 
          (SELECT COUNT(*)::int FROM attendance WHERE student_id = $1 AND UPPER(TRIM(COALESCE(status::text, ''))) = 'PRESENT'), 0)) as a`,
      [studentId],
    );
    present_days = Number(counts[0]?.p) || 0;
    /** PRESENT bo‘lmagan barcha qatorlar — tarixda «Qoldirdi» ko‘rinadiganlar bilan mos. */
    absent_days = Number(counts[0]?.a) || 0;
  } catch {
    present_days = 0;
    absent_days = 0;
  }

  let courses: any[] = [];
  try {
    courses = await dbService.query(
      `SELECT c.name as course_name, c.id as course_id, sc.created_at as joined_at, NULL::text as current_level
       FROM student_courses sc
       JOIN courses c ON sc.course_id = c.id
       WHERE sc.student_id = $1`,
      [studentId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      try {
        courses = await dbService.query(
          `SELECT c.name as course_name, c.id as course_id
           FROM student_courses sc
           JOIN courses c ON sc.course_id = c.id
           WHERE sc.student_id = $1`,
          [studentId],
        );
      } catch {
        courses = [];
      }
    } else {
      courses = [];
    }
  }

  let groups: any[] = [];
  try {
    groups = await dbService.query(
      `SELECT g.name as group_name, g.id as group_id,
              COALESCE(NULLIF(TRIM(CONCAT(COALESCE(u.first_name, ''), ' ', COALESCE(u.last_name, ''))), ''), u.email) as teacher_name
       FROM group_students gs
       JOIN groups g ON gs.group_id = g.id
       LEFT JOIN users u ON u.id = g.teacher_id
       WHERE gs.student_id = $1 AND (gs.left_at IS NULL)`,
      [studentId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      try {
        groups = await dbService.query(
          `SELECT g.name as group_name, g.id as group_id
           FROM group_students gs
           JOIN groups g ON gs.group_id = g.id
           WHERE gs.student_id = $1`,
          [studentId],
        );
      } catch {
        groups = [];
      }
    } else {
      groups = [];
    }
  }

  let payments: any[] = [];
  try {
    payments = await dbService.query(
      `SELECT amount, paid_at, course_id 
       FROM payments 
       WHERE student_id = $1 
       ORDER BY paid_at DESC NULLS LAST`,
      [studentId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      try {
        payments = await dbService.query(
          `SELECT amount, paid_at FROM payments WHERE student_id = $1 ORDER BY paid_at DESC NULLS LAST`,
          [studentId],
        );
      } catch {
        payments = [];
      }
    } else {
      payments = [];
    }
  }

  let attendance_history: any[] = [];
  try {
    attendance_history = await dbService.query(
      `SELECT lesson_date, status 
       FROM attendance 
       WHERE student_id = $1 
       ORDER BY lesson_date DESC NULLS LAST
       LIMIT 30`,
      [studentId],
    );
  } catch {
    attendance_history = [];
  }

  let exams: any[] = [];
  try {
    exams = await dbService.query(
      `SELECT er.score, COALESCE(er.submitted_at, er.created_at) AS submitted_at, e.title as exam_title, e.id as exam_id
       FROM exam_results er
       JOIN exams e ON er.exam_id = e.id
       WHERE er.student_id = $1
       ORDER BY COALESCE(er.submitted_at, er.created_at) DESC NULLS LAST`,
      [studentId],
    );
  } catch {
    try {
      exams = await dbService.query(
        `SELECT er.score, er.created_at AS submitted_at, e.title as exam_title, e.id as exam_id
         FROM exam_results er
         JOIN exams e ON er.exam_id = e.id
         WHERE er.student_id = $1
         ORDER BY er.created_at DESC NULLS LAST`,
        [studentId],
      );
    } catch {
      exams = [];
    }
  }

  return {
    ...student[0],
    present_days,
    absent_days,
    courses,
    groups,
    payments,
    attendance_trend: attendance_history,
    exams,
  };
}
