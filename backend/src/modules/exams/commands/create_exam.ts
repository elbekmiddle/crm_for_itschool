import { DbService } from '../../../infrastructure/database/db.service';
import { CreateExamDto } from '../dto/create-exam.dto';

export async function create_exam(dbService: DbService, createExamDto: CreateExamDto, teacherId: string) {
  const { title, course_id, group_id } = createExamDto;

  if (group_id) {
    try {
      const withGroup = await dbService.query(
        `INSERT INTO exams (title, course_id, created_by, group_id) VALUES ($1, $2, $3, $4) RETURNING *`,
        [title, course_id, teacherId, group_id],
      );
      return withGroup[0];
    } catch (e: any) {
      if (e?.code !== '42703') throw e;
    }
  }

  const result = await dbService.query(
    `INSERT INTO exams (title, course_id, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [title, course_id, teacherId],
  );
  return result[0];
}
