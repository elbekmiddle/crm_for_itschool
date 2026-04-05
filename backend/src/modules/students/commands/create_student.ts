import { DbService } from '../../../infrastructure/database/db.service';
import { CreateStudentDto } from '../dto/create-student.dto';
import { ConflictException } from '@nestjs/common';

export async function create_student(dbService: DbService, createStudentDto: CreateStudentDto, createdBy: string) {
  const normalize = (p: string) => {
    if (!p) return null;
    let clean = p.replace(/\D/g, ''); 
    if (clean.length === 9) clean = '998' + clean;
    if (clean.startsWith('8')) clean = '99' + clean; // Handle 8... if needed
    return '+' + clean;
  };

  const phone_norm = normalize(createStudentDto.phone);
  const parent_phone_norm = normalize(createStudentDto.parent_phone);

  const { first_name, last_name, parent_name } = createStudentDto;

  try {
    const result = await dbService.query(
      `INSERT INTO students (first_name, last_name, phone, parent_name, parent_phone, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, phone_norm, parent_name || null, parent_phone_norm || null, createdBy]
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
