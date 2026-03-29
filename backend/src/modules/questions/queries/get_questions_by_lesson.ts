import { DbService } from '../../../infrastructure/database/db.service';

export async function get_questions_by_lesson(dbService: DbService, lessonId: string) {
  return dbService.query(
    `SELECT * FROM questions WHERE lesson_id = $1 AND deleted_at IS NULL ORDER BY created_at ASC`,
    [lessonId]
  );
}
