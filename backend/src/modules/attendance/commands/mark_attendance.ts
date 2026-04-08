import { DbService } from '../../../infrastructure/database/db.service';

export async function mark_attendance(dbService: DbService, data: any) {
  const { group_id, student_id, status, lesson_id, lesson_date } = data;
  const finalDate = lesson_date || new Date().toISOString().split('T')[0];
  const lid = lesson_id ?? null;

  const updated = await dbService.query(
    `UPDATE attendance SET status = $1
     WHERE group_id = $2 AND student_id = $3 AND lesson_date = $4::date
     RETURNING *`,
    [status, group_id, student_id, finalDate],
  );
  if (updated?.[0]) return updated[0];

  const inserted = await dbService.query(
    `INSERT INTO attendance (group_id, student_id, lesson_id, lesson_date, status)
     VALUES ($1, $2, $3, $4::date, $5) RETURNING *`,
    [group_id, student_id, lid, finalDate, status],
  );
  return inserted[0];
}
