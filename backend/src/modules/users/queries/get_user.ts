import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function get_user(dbService: DbService, id: string) {
  const result = await dbService.query(
    `SELECT id, email, role, created_at 
     FROM users 
     WHERE id = $1`,
    [id]
  );
  if (!result.length) throw new NotFoundException('Foydalanuvchi topilmadi');
  return result[0];
}
