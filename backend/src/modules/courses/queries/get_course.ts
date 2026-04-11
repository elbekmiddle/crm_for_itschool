import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';

export async function get_course(dbService: DbService, id: string) {
  const result = await dbService.query(`SELECT * FROM courses WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!result.length) throw new NotFoundException('Kurs topilmadi');
  return result[0];
}
