import { DbService } from '../../../infrastructure/database/db.service';
import { BadRequestException } from '@nestjs/common';

const MAX_COURSES = 5;

/**
 * Links up to MAX_COURSES courses to a teacher via courses.teacher_id.
 * If role is not TEACHER, clears all assignments for this user.
 * @param skipIfUndefined — PATCH: omit course_ids to leave assignments unchanged
 */
export async function syncTeacherCourses(
  db: DbService,
  userId: string,
  role: string,
  courseIds: string[] | undefined | null,
  options: { skipIfUndefined?: boolean } = {},
) {
  if (options.skipIfUndefined && (courseIds === undefined || courseIds === null)) {
    return;
  }

  if (role !== 'TEACHER') {
    await db.query(`UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1`, [userId]);
    return;
  }

  const raw = Array.isArray(courseIds) ? courseIds : [];
  const unique = [...new Set(raw.filter(Boolean))];
  if (unique.length > MAX_COURSES) {
    throw new BadRequestException(`O'qituvchiga maksimal ${MAX_COURSES} ta kurs biriktirish mumkin`);
  }

  if (unique.length === 0) {
    await db.query(`UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1`, [userId]);
    return;
  }

  await db.query(
    `UPDATE courses SET teacher_id = NULL WHERE teacher_id = $1 AND id NOT IN (SELECT unnest($2::uuid[]))`,
    [userId, unique],
  );
  await db.query(`UPDATE courses SET teacher_id = $1 WHERE id = ANY($2::uuid[])`, [userId, unique]);
}
