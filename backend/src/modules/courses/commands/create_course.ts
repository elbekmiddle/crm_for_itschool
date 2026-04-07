import { DbService } from '../../../infrastructure/database/db.service';

type AuthUser = { id?: string; role?: string };

export async function create_course(dbService: DbService, data: any, createdBy?: AuthUser) {
  const description = data.description?.trim() || null;
  const duration =
    data.duration_months !== undefined && data.duration_months !== ''
      ? Math.max(1, Number(data.duration_months))
      : null;
  const teacherId =
    data.teacher_id || (createdBy?.role === 'TEACHER' && createdBy?.id ? createdBy.id : null);

  const result = await dbService.query(
    `INSERT INTO courses (name, price, description, duration_months, teacher_id)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [data.name, data.price, description, duration, teacherId],
  );
  return result[0];
}
