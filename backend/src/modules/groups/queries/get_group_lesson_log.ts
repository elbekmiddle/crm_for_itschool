import { DbService } from '../../../infrastructure/database/db.service';

export async function get_group_lesson_log(dbService: DbService, groupId: string, lessonDate: string) {
  const rows = await dbService.query(
    `SELECT * FROM group_lesson_log WHERE group_id = $1 AND lesson_date = $2::date LIMIT 1`,
    [groupId, lessonDate],
  );
  return rows[0] || null;
}
