import { DbService } from '../../../infrastructure/database/db.service';

export async function create_group(dbService: DbService, data: any) {
  const { name, course_id, teacher_id } = data;
  const result = await dbService.query(
    `INSERT INTO groups (name, course_id, teacher_id) VALUES ($1, $2, $3) RETURNING *`,
    [name, course_id, teacher_id]
  );
  return result[0];
}
