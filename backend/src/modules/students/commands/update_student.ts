import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { get_student } from '../queries/get_student';

export async function update_student(dbService: DbService, id: string, updateStudentDto: UpdateStudentDto) {
  const { first_name, last_name, phone } = updateStudentDto;
  
  const updates = [];
  const values = [];
  let queryIdx = 1;

  if (first_name) {
    updates.push(`first_name = $${queryIdx++}`);
    values.push(first_name);
  }
  if (last_name) {
    updates.push(`last_name = $${queryIdx++}`);
    values.push(last_name);
  }
  if (phone) {
    updates.push(`phone = $${queryIdx++}`);
    values.push(phone);
  }

  if (!updates.length) return get_student(dbService, id);

  values.push(id);
  const query = `UPDATE students SET ${updates.join(', ')} WHERE id = $${queryIdx} AND deleted_at IS NULL RETURNING *`;
  
  const result = await dbService.query(query, values);
  if (!result.length) throw new NotFoundException('Student not found');
  return result[0];
}
