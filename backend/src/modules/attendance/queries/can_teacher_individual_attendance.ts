import { DbService } from '../../../infrastructure/database/db.service';

export async function can_teacher_individual_attendance(
  dbService: DbService,
  teacherId: string,
  studentId: string,
): Promise<boolean> {
  try {
    const rows = await dbService.query(
      `SELECT 1 FROM students s
       WHERE s.id = $2 AND s.deleted_at IS NULL
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
       LIMIT 1`,
      [teacherId, studentId],
    );
    return (rows?.length || 0) > 0;
  } catch (e: any) {
    if (e?.code === '42703') {
      const rows = await dbService.query(
        `SELECT 1 FROM students s
         WHERE s.id = $2 AND s.deleted_at IS NULL
         AND NOT EXISTS (SELECT 1 FROM group_students gs WHERE gs.student_id = s.id)
         AND EXISTS (
           SELECT 1 FROM student_courses sc
           INNER JOIN courses c ON c.id = sc.course_id
           WHERE sc.student_id = s.id AND sc.status = 'active'
             AND c.teacher_id = $1
         )
         LIMIT 1`,
        [teacherId, studentId],
      );
      return (rows?.length || 0) > 0;
    }
    throw e;
  }
}
