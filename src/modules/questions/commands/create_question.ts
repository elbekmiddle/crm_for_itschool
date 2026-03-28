import { DbService } from '../../../infrastructure/database/db.service';

export async function create_question(dbService: DbService, data: any, createdBy: string) {
  const { lesson_id, level, text } = data;
  const result = await dbService.query(
    `INSERT INTO questions (lesson_id, created_by, level, text) VALUES ($1, $2, $3, $4) RETURNING *`,
    [lesson_id, createdBy, level, text]
  );
  return result[0];
}
