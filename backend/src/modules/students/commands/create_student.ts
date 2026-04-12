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

  const dupExact = await dbService.querySafe(
    `SELECT id FROM students 
     WHERE phone = $1 
       AND LOWER(TRIM(first_name)) = LOWER(TRIM($2::text))
       AND LOWER(TRIM(COALESCE(last_name, ''))) = LOWER(TRIM(COALESCE($3::text, '')))`,
    [phone_norm, first_name, last_name || ''],
    [],
  );
  if (dupExact.length) {
    throw new ConflictException(
      'Bunday ism, familiya va telefon bilan talaba allaqachon mavjud',
    );
  }

  try {
    const result = await dbService.query(
      `INSERT INTO students (first_name, last_name, phone, parent_name, parent_phone, created_by) 
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [first_name, last_name, phone_norm, parent_name || null, parent_phone_norm || null, createdBy]
    );
    return result[0];
  } catch (error: any) {
    if (error?.code === '23505') {
      const c = String(error?.constraint ?? '');
      const d = String(error?.detail ?? '');
      if (c.includes('phone') || d.includes('(phone)')) {
        throw new ConflictException('Bu telefon raqam bilan talaba allaqachon mavjud');
      }
      if (c.includes('parent_phone') || d.includes('(parent_phone)')) {
        throw new ConflictException('Ota-ona telefoni allaqachon ro‘yxatdan o‘tgan');
      }
    }
    throw error;
  }
}
