import { DbService } from '../../../infrastructure/database/db.service';
import { BadRequestException } from '@nestjs/common';

export async function create_group(dbService: DbService, data: any) {
  const { name, course_id, teacher_id } = data;
  const capacity = data.capacity ?? data.max_students ?? 20;
  const schedule = data.schedule ?? null;

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

  try {
    const result = await dbService.query(
      `INSERT INTO groups (name, course_id, teacher_id, capacity, schedule) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name, course_id, teacher_id, capacity, schedule],
    );
    return result[0];
  } catch (e: any) {
    if (e?.code === '42703') {
      const result = await dbService.query(
        `INSERT INTO groups (name, course_id, teacher_id, capacity) VALUES ($1, $2, $3, $4) RETURNING *`,
        [name, course_id, teacher_id, capacity],
      );
      return result[0];
    }
    throw e;
  }
}
