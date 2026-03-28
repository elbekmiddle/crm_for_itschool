import { DbService } from '../../../infrastructure/database/db.service';

export async function enroll_student(dbService: DbService, studentId: string, courseId: string) {
  const result = await dbService.query(
    `INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *`,
    [studentId, courseId]
  );
  return { success: true, count: result.length };
}
