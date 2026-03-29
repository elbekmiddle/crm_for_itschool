import { DbService } from '../../../infrastructure/database/db.service';

export async function get_user_by_id_for_auth(dbService: DbService, id: string) {
  return dbService.query(
    'SELECT id, email, role FROM users WHERE id = $1',
    [id]
  );
}
