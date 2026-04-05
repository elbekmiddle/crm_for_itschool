import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_by_id_with_auth_data(dbService: DbService, id: string) {
  return dbService.query(
    'SELECT id, phone, first_name, last_name, parent_name FROM students WHERE id = $1 AND deleted_at IS NULL',
    [id]
  );
}
