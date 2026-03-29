import { DbService } from '../../../infrastructure/database/db.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { ConflictException } from '@nestjs/common';

export async function create_student(dbService: DbService, createStudentDto: CreateStudentDto, createdBy: string) {
  const { first_name, last_name, phone, parent_name, parent_phone } = createStudentDto;

  try {
    const result = await dbService.query(
      `INSERT INTO students (first_name, last_name, phone, parent_name, parent_phone, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, phone, parent_name || null, parent_phone || null, createdBy]
    );
    return result[0];
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      if (error.detail.includes('phone')) {
        throw new ConflictException('Phone number already exists');
      }
      if (error.detail.includes('parent_phone')) {
        throw new ConflictException('Parent phone number already exists');
      }
    }
    throw error;
  }
}
