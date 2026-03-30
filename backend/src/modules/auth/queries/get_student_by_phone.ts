import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_by_phone(db: DbService, phone: string) {
  const query = `
    SELECT id, first_name, last_name, phone
    FROM students
    WHERE phone = $1 AND deleted_at IS NULL
  `;
  return db.query(query, [phone]);
}
