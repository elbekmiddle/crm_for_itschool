import { DbService } from '../../../infrastructure/database/db.service';
import { NotFoundException } from '@nestjs/common';
import { UpdateStudentDto } from '../dto/update-student.dto';
import { get_student } from '../queries/get_student';

export async function update_student(dbService: DbService, id: string, updateStudentDto: UpdateStudentDto) {
  const normalize = (p: string) => {
    if (!p) return null;
    let clean = p.replace(/\D/g, ''); 
    if (clean.length === 9) clean = '998' + clean;
    return '+' + clean;
  };

  const updates = [];
  const values = [];
  let queryIdx = 1;

  const data: any = { ...updateStudentDto };
  if (data.phone) data.phone = normalize(data.phone);
  if (data.parent_phone) data.parent_phone = normalize(data.parent_phone);

  const fields = ['first_name', 'last_name', 'phone', 'parent_name', 'parent_phone', 'status', 'email'];
  
  for (const field of fields) {
    if (data[field] !== undefined) {
      updates.push(`${field} = $${queryIdx++}`);
      values.push(data[field]);
    }
  }

  if (!updates.length) return get_student(dbService, id);

  values.push(id);
  const query = `UPDATE students SET ${updates.join(', ')} WHERE id = $${queryIdx} AND deleted_at IS NULL RETURNING *`;
  
  const result = await dbService.query(query, values);
  if (!result.length) throw new NotFoundException('Student not found');
  return result[0];
}
