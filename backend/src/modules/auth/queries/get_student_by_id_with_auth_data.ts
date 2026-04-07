import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_by_id_with_auth_data(dbService: DbService, id: string) {
  const full = await dbService.querySafe(
    `SELECT id, phone, first_name, last_name, parent_name, email
     FROM students WHERE id = $1 AND deleted_at IS NULL`,
    [id],
    [],
  );
  if (full.length) return full;
  return dbService.querySafe(
    `SELECT id, phone, first_name, last_name, parent_name FROM students WHERE id = $1`,
    [id],
    [],
  );
}
