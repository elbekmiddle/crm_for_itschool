import { DbService } from '../../../infrastructure/database/db.service';

export async function all_payments(dbService: DbService) {
  return dbService.query(`SELECT * FROM payments ORDER BY paid_at DESC`);
}
