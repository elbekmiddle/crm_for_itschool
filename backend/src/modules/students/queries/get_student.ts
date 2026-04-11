import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function get_student(dbService: DbService, id: string) {
  const result = await dbService.query(
    `SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );
  if (!result.length) throw new NotFoundException('Talaba topilmadi');
  return result[0];
}
