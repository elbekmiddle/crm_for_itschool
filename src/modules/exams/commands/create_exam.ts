import { DbService } from '../../../infrastructure/database/db.service';
import { CreateExamDto } from '../dto/create-exam.dto';

export async function create_exam(dbService: DbService, createExamDto: CreateExamDto, teacherId: string) {
  const { title, course_id } = createExamDto;
  const result = await dbService.query(
    `INSERT INTO exams (title, course_id, created_by) VALUES ($1, $2, $3) RETURNING *`,
    [title, course_id, teacherId]
  );
  return result[0];
}
