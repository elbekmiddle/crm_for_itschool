import { DbService } from '../../../infrastructure/database/db.service';
import * as bcrypt from 'bcrypt';

export async function create_user(dbService: DbService, data: any) {
  const { email, password, role } = data;
  const hashedPassword = await bcrypt.hash(password, 10);
  const result = await dbService.query(
    `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
    [email, hashedPassword, role || 'TEACHER']
  );
  return result[0];
}
