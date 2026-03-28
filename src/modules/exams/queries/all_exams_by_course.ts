import { DbService } from '../../../infrastructure/database/db.service';

export async function all_exams_by_course(dbService: DbService, courseId: string) {
  return dbService.query(`SELECT * FROM exams WHERE course_id = $1 ORDER BY created_at DESC`, [courseId]);
}
