import { DbService } from '../../../infrastructure/database/db.service';

export async function get_group_attendance(dbService: DbService, groupId: string) {
  return dbService.query(
    `SELECT * FROM attendance WHERE group_id = $1 ORDER BY created_at DESC`,
    [groupId]
  );
}
