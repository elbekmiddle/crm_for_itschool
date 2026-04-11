import { DbService } from '../../../infrastructure/database/db.service';

export async function mark_attendance(dbService: DbService, data: any) {
  const { group_id, student_id, status, lesson_id, lesson_date } = data;
  const finalDate = lesson_date || new Date().toISOString().split('T')[0];
  const lid = lesson_id ?? null;
  const gid = group_id != null && group_id !== '' ? group_id : null;

  let updated: any[];
  if (gid) {
    updated = await dbService.query(
      `UPDATE attendance SET status = $1
       WHERE group_id = $2 AND student_id = $3 AND lesson_date = $4::date
       RETURNING *`,
      [status, gid, student_id, finalDate],
    );
  } else {
    updated = await dbService.query(
      `UPDATE attendance SET status = $1
       WHERE group_id IS NULL AND student_id = $2 AND lesson_date = $3::date
       RETURNING *`,
      [status, student_id, finalDate],
    );
  }
  if (updated?.[0]) return updated[0];

  const inserted = await dbService.query(
    `INSERT INTO attendance (group_id, student_id, lesson_id, lesson_date, status)
     VALUES ($1, $2, $3, $4::date, $5) RETURNING *`,
    [gid, student_id, lid, finalDate, status],
  );
  return inserted[0];
}
