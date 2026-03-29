import { DbService } from '../../../infrastructure/database/db.service';

export async function remove_student_from_group(dbService: DbService, groupId: string, studentId: string) {
  await dbService.query(
    `DELETE FROM group_students WHERE group_id = $1 AND student_id = $2`,
    [groupId, studentId]
  );
  return { success: true };
}
