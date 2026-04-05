import { DbService } from '../../../infrastructure/database/db.service';

export async function get_student_by_phone(db: DbService, phone: string) {
  // Normalize: remove all non-digits, then try both with/without leading +
  const raw = phone.replace(/\D/g, ''); // e.g. "998976637200"

  const query = `
    SELECT id, first_name, last_name, phone, password, telegram_chat_id, is_verified
    FROM students
    WHERE (
      phone = $1
      OR phone = $2
      OR REGEXP_REPLACE(phone, '[^0-9]', '', 'g') = $3
    )
    AND deleted_at IS NULL
    LIMIT 1
  `;

  // Try: exact match, with-plus match, digits-only match
  return db.query(query, [
    phone,           // e.g. "+998976637200"
    `+${raw}`,       // always with plus
    raw,             // digits only "998976637200"
  ]);
}
