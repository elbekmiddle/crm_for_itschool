import { DbService } from '../../../infrastructure/database/db.service';

/** Guruhga bog‘lanmagan davomat yozuvlari (group_id IS NULL) */
export async function get_individual_attendance(dbService: DbService, studentId: string) {
  return dbService.query(
    `SELECT * FROM attendance
     WHERE student_id = $1 AND group_id IS NULL
     ORDER BY created_at DESC`,
    [studentId],
  );
}
