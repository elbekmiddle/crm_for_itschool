import { DbService } from '../../../infrastructure/database/db.service';

export async function get_group_students(dbService: DbService, groupId: string) {
  return dbService.query(
    `SELECT s.* FROM students s 
     JOIN group_students gs ON s.id = gs.student_id 
     WHERE gs.group_id = $1 AND s.deleted_at IS NULL`,
    [groupId]
  );
}
