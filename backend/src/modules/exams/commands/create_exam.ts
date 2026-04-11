import { DbService } from '../../../infrastructure/database/db.service';
import { CreateExamDto } from '../dto/create-exam.dto';

async function syncTimeLimitIfPresent(dbService: DbService, examId: string, minutes: number) {
  try {
    await dbService.query(`UPDATE exams SET time_limit = $2 WHERE id = $1`, [examId, minutes]);
  } catch (e: any) {
    if (e?.code !== '42703') throw e;
  }
}

export async function create_exam(dbService: DbService, createExamDto: CreateExamDto, teacherId: string) {
  const { title, course_id, group_id, duration_minutes, passing_score } = createExamDto;
  const dm =
    duration_minutes != null && Number.isFinite(Number(duration_minutes))
      ? Math.round(Number(duration_minutes))
      : 60;
  const ps =
    passing_score != null && Number.isFinite(Number(passing_score))
      ? Math.round(Number(passing_score))
      : 60;

  if (group_id) {
    try {
      const withGroup = await dbService.query(
        `INSERT INTO exams (title, course_id, created_by, group_id, duration_minutes, passing_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, course_id, teacherId, group_id, dm, ps],
      );
      await syncTimeLimitIfPresent(dbService, withGroup[0].id, dm);
      return withGroup[0];
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
    }
  }

  const result = await dbService.query(
    `INSERT INTO exams (title, course_id, created_by, duration_minutes, passing_score)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [title, course_id, teacherId, dm, ps],
  );
  await syncTimeLimitIfPresent(dbService, result[0].id, dm);
  return result[0];
}
