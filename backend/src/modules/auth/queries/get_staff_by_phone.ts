import { DbService } from '../../../infrastructure/database/db.service';

/** Telefon bo‘yicha xodim (users): o‘qituvchi / menejer / admin */
export async function get_staff_by_phone(dbService: DbService, phone: string) {
  return dbService.querySafe(
    `SELECT id, email, password, role, first_name, last_name, phone, telegram_chat_id
     FROM users
     WHERE REGEXP_REPLACE(COALESCE(phone, ''), '[^0-9]', '', 'g')
       = REGEXP_REPLACE($1::text, '[^0-9]', '', 'g')
       AND role IN ('TEACHER', 'MANAGER', 'ADMIN')
     LIMIT 1`,
    [phone],
    [],
  );
}
