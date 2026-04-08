import { DbService } from '../../../infrastructure/database/db.service';

export async function upsert_group_lesson_log(
  dbService: DbService,
  groupId: string,
  lessonDate: string,
  topic: string | null,
) {
  const rows = await dbService.query(
    `INSERT INTO group_lesson_log (group_id, lesson_date, topic, updated_at)
     VALUES ($1, $2::date, $3, NOW())
     ON CONFLICT (group_id, lesson_date)
     DO UPDATE SET topic = EXCLUDED.topic, updated_at = NOW()
     RETURNING *`,
    [groupId, lessonDate, topic],
  );
  return rows[0];
}
