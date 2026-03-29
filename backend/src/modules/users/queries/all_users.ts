import { DbService } from '../../../infrastructure/database/db.service';

export async function all_users(dbService: DbService) {
  return dbService.query(`SELECT id, email, role, created_at FROM users ORDER BY created_at DESC`);
}
