import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(private readonly dbService: DbService) {}

  async create(createStudentDto: CreateStudentDto, createdBy: string) {
    const { first_name, last_name, phone } = createStudentDto;
    const result = await this.dbService.query(
      `INSERT INTO students (first_name, last_name, phone, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [first_name, last_name, phone, createdBy]
    );
    return result[0];
  }

  async findAll(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    
    const [data, total] = await Promise.all([
      this.dbService.query(
        `SELECT * FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      this.dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`)
    ]);

    return {
      data,
      meta: {
        total: parseInt(total[0].count, 10),
        page,
        limit,
        totalPages: Math.ceil(parseInt(total[0].count, 10) / limit)
      }
    };
  }

  async findOne(id: string) {
    const result = await this.dbService.query(
      `SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`,
      [id]
    );
    if (!result.length) throw new NotFoundException('Student not found');
    return result[0];
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
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

    if (!updates.length) return this.findOne(id);

    values.push(id);
    const query = `UPDATE students SET ${updates.join(', ')} WHERE id = $${queryIdx} AND deleted_at IS NULL RETURNING *`;
    
    const result = await this.dbService.query(query, values);
    if (!result.length) throw new NotFoundException('Student not found');
    return result[0];
  }

  async remove(id: string) {
    const result = await this.dbService.query(
      `UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!result.length) throw new NotFoundException('Student not found');
    return { success: true };
  }

  async enroll(studentId: string, courseId: string) {
    try {
      const result = await this.dbService.query(
        `INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING RETURNING *`,
        [studentId, courseId]
      );
      if (!result.length) {
         throw new ConflictException('Student is already enrolled in this course');
      }
      return result[0];
    } catch (error: any) {
      if (error instanceof ConflictException) throw error;
      throw new ConflictException('Failed to enroll: Verify course and student exist.');
    }
  }
}
