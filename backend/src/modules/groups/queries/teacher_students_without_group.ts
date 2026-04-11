import { DbService } from '../../../infrastructure/database/db.service';

/**
 * Ustozning kursiga yozilgan, lekin hech qaysi guruhga kirmagan talabalar.
 */
export async function teacher_students_without_group(dbService: DbService, teacherId: string) {
  try {
    return await dbService.query(
      `SELECT DISTINCT s.id, s.first_name, s.last_name, s.phone, s.status, s.parent_name,
        (SELECT c.id FROM student_courses sc
         INNER JOIN courses c ON c.id = sc.course_id
         WHERE sc.student_id = s.id AND sc.status = 'active' AND c.teacher_id = $1
         ORDER BY sc.created_at DESC LIMIT 1) AS course_id,
        (SELECT c.name FROM student_courses sc
         JOIN courses c ON c.id = sc.course_id
         WHERE sc.student_id = s.id AND sc.status = 'active'
         ORDER BY sc.created_at DESC LIMIT 1) AS course_name
       FROM students s
       WHERE s.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1 FROM group_students gs
         WHERE gs.student_id = s.id AND (gs.left_at IS NULL)
       )
       AND EXISTS (
         SELECT 1 FROM student_courses sc
         INNER JOIN courses c ON c.id = sc.course_id
         WHERE sc.student_id = s.id AND sc.status = 'active'
           AND c.teacher_id = $1
           AND (c.deleted_at IS NULL)
       )
       ORDER BY s.first_name NULLS LAST, s.last_name NULLS LAST`,
      [teacherId],
    );
  } catch (e: any) {
    if (e?.code === '42703') {
      return dbService.query(
        `SELECT DISTINCT s.id, s.first_name, s.last_name, s.phone, s.status, s.parent_name,
          (SELECT c.id FROM student_courses sc
           INNER JOIN courses c ON c.id = sc.course_id
           WHERE sc.student_id = s.id AND sc.status = 'active' AND c.teacher_id = $1
           ORDER BY sc.created_at DESC LIMIT 1) AS course_id,
          (SELECT c.name FROM student_courses sc
           JOIN courses c ON c.id = sc.course_id
           WHERE sc.student_id = s.id AND sc.status = 'active'
           ORDER BY sc.created_at DESC LIMIT 1) AS course_name
         FROM students s
         WHERE s.deleted_at IS NULL
         AND NOT EXISTS (
           SELECT 1 FROM group_students gs WHERE gs.student_id = s.id
         )
         AND EXISTS (
           SELECT 1 FROM student_courses sc
           INNER JOIN courses c ON c.id = sc.course_id
           WHERE sc.student_id = s.id AND sc.status = 'active'
             AND c.teacher_id = $1
         )
         ORDER BY s.first_name NULLS LAST, s.last_name NULLS LAST`,
        [teacherId],
      );
    }
    throw e;
  }
}
