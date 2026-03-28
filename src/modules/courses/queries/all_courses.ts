import { DbService } from '../../../infrastructure/database/db.service';

export async function all_courses(dbService: DbService) {
  return dbService.query(`SELECT * FROM courses WHERE deleted_at IS NULL ORDER BY created_at DESC`);
}
