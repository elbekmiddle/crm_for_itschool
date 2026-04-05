import { DbService } from '../../../infrastructure/database/db.service';

export async function all_users(dbService: DbService) {
  return dbService.query(`SELECT id, email, role, first_name, last_name, phone, photo_url, created_at FROM users ORDER BY created_at DESC`);
}
