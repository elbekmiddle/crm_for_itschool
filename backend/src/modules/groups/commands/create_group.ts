import { DbService } from '../../../infrastructure/database/db.service';
import { BadRequestException } from '@nestjs/common';

export async function create_group(dbService: DbService, data: any) {
  const { name, course_id, teacher_id, capacity } = data;

  const courseExists = await dbService.querySafe(
    'SELECT id FROM courses WHERE id = $1 AND deleted_at IS NULL LIMIT 1',
    [course_id],
    [],
  );

  const fallbackCourseExists = courseExists.length
    ? courseExists
    : await dbService.querySafe('SELECT id FROM courses WHERE id = $1 LIMIT 1', [course_id], []);

  if (!fallbackCourseExists.length) {
    throw new BadRequestException('Guruh yaratish uchun avval mavjud kurs tanlang.');
  }

  const result = await dbService.query(
    `INSERT INTO groups (name, course_id, teacher_id, capacity) VALUES ($1, $2, $3, $4) RETURNING *`,
    [name, course_id, teacher_id, capacity || 20]
  );
  return result[0];
}
