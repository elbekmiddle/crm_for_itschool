import { DbService } from '../../../infrastructure/database/db.service';
import { CreateExamDto } from '../dto/create-exam.dto';

async function syncTimeLimitIfPresent(dbService: DbService, examId: string, minutes: number) {
  try {
    await dbService.query(`UPDATE exams SET time_limit = $2 WHERE id = $1`, [examId, minutes]);
  } catch (e: any) {
    if (e?.code !== '42703') throw e;
  }
}

export async function create_exam(
  dbService: DbService,
  createExamDto: CreateExamDto,
  teacherId: string,
  individualStudentIds?: string[],
) {
  const { title, course_id, group_id, duration_minutes, passing_score } = createExamDto;
  const dm =
    duration_minutes != null && Number.isFinite(Number(duration_minutes))
      ? Math.round(Number(duration_minutes))
      : 60;
  const ps =
    passing_score != null && Number.isFinite(Number(passing_score))
      ? Math.round(Number(passing_score))
      : 60;

  let row: any;
  if (group_id) {
    try {
      const withGroup = await dbService.query(
        `INSERT INTO exams (title, course_id, created_by, group_id, duration_minutes, passing_score)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [title, course_id, teacherId, group_id, dm, ps],
      );
      row = withGroup[0];
      await syncTimeLimitIfPresent(dbService, row.id, dm);
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
    }
  }

  if (!row) {
    const result = await dbService.query(
      `INSERT INTO exams (title, course_id, created_by, duration_minutes, passing_score)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [title, course_id, teacherId, dm, ps],
    );
    row = result[0];
    await syncTimeLimitIfPresent(dbService, row.id, dm);
  }

  const examId = row.id as string;
  if (individualStudentIds?.length) {
    for (const sid of individualStudentIds) {
      try {
        await dbService.query(
          `INSERT INTO exam_individual_students (exam_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
          [examId, sid],
        );
      } catch (e: any) {
        if (e?.code !== '42P01' && e?.code !== '42703') throw e;
      }
    }
  }
  return row;
}
