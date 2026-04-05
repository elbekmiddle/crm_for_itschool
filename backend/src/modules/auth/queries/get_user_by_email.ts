import { DbService } from '../../../infrastructure/database/db.service';

export async function get_user_by_email(dbService: DbService, email: string) {
  return dbService.query(
    'SELECT id, email, password, role, first_name, last_name, phone, telegram_chat_id FROM users WHERE email = $1',
    [email]
  );
}
