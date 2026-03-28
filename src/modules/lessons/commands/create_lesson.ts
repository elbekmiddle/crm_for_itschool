import { DbService } from '../../../infrastructure/database/db.service';

export async function create_lesson(dbService: DbService, data: any) {
  const { course_id, title } = data;
  const result = await dbService.query(
    `INSERT INTO lessons (course_id, title) VALUES ($1, $2) RETURNING *`,
    [course_id, title]
  );
  return result[0];
}
