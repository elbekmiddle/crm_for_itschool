import { DbService } from '../../../infrastructure/database/db.service';

export async function get_user_by_email(dbService: DbService, email: string) {
  return dbService.query(
    'SELECT id, email, password, role FROM users WHERE email = $1',
    [email]
  );
}
