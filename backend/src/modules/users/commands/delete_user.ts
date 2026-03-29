import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function delete_user(dbService: DbService, id: string) {
  const result = await dbService.query(
    `DELETE FROM users WHERE id = $1 RETURNING id`,
    [id]
  );
  if (!result.length) throw new NotFoundException('User not found');
  return result[0];
}
