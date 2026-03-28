import { DbService } from '../../../infrastructure/database/db.service';

export async function all_groups(dbService: DbService) {
  return dbService.query(`SELECT * FROM groups ORDER BY created_at DESC`);
}
