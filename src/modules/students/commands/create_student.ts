import { DbService } from '../../../infrastructure/database/db.service';
import { CreateStudentDto } from '../dto/create-student.dto';

export async function create_student(dbService: DbService, createStudentDto: CreateStudentDto, createdBy: string) {
  const { first_name, last_name, phone } = createStudentDto;
  const result = await dbService.query(
    `INSERT INTO students (first_name, last_name, phone, created_by) 
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [first_name, last_name, phone, createdBy]
  );
  return result[0];
}
