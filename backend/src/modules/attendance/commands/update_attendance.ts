import { DbService } from '../../../infrastructure/database/db.service';

export async function update_attendance(dbService: DbService, id: string, status: string) {
  const result = await dbService.query(
    `UPDATE attendance SET status = $1 WHERE id = $2 RETURNING *`,
    [status, id]
  );
  return result[0];
}
