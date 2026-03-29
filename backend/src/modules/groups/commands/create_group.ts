import { DbService } from '../../../infrastructure/database/db.service';

export async function create_group(dbService: DbService, data: any) {
  const { name, course_id, teacher_id, capacity } = data;
  const result = await dbService.query(
    `INSERT INTO groups (name, course_id, teacher_id, capacity) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, course_id, teacher_id, capacity || 20]
  );
  return result[0];
}
