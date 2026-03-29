import { DbService } from '../../../infrastructure/database/db.service';

export async function get_lessons_by_course(dbService: DbService, courseId: string) {
  return dbService.query(
    `SELECT * FROM lessons WHERE course_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
    [courseId]
  );
}
