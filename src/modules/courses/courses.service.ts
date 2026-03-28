import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class CoursesService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { name, price } = data;
    const result = await this.dbService.query(
      `INSERT INTO courses (name, price) VALUES ($1, $2) RETURNING *`,
      [name, price]
    );
    return result[0];
  }

  async findAll() {
    return this.dbService.query(`SELECT * FROM courses ORDER BY created_at DESC`);
  }

  async findOne(id: string) {
    const result = await this.dbService.query(`SELECT * FROM courses WHERE id = $1`, [id]);
    if (!result.length) throw new NotFoundException('Course not found');
    return result[0];
  }

  async getStudents(courseId: string) {
    const query = `
      SELECT 
        s.id, 
        s.first_name, 
        s.last_name, 
        s.phone,
        CASE WHEN gs.group_id IS NOT NULL THEN 'GROUP' ELSE 'INDIVIDUAL' END as study_type,
        g.name as group_name
      FROM students s
      JOIN student_courses sc ON sc.student_id = s.id
      LEFT JOIN group_students gs ON gs.student_id = s.id
      LEFT JOIN groups g ON g.id = gs.group_id AND g.course_id = sc.course_id
      WHERE sc.course_id = $1 AND s.deleted_at IS NULL
      ORDER BY study_type, s.first_name
    `;
    return this.dbService.query(query, [courseId]);
  }

  async update(id: string, data: any) {
    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (data.name) { updates.push(`name = $${queryIndex++}`); values.push(data.name); }
    if (data.price !== undefined) { updates.push(`price = $${queryIndex++}`); values.push(data.price); }

    if (updates.length === 0) return { success: false, message: 'Nothing to update' };
    values.push(id);
    const result = await this.dbService.query(
      `UPDATE courses SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!result.length) throw new NotFoundException('Course not found');
    return result[0];
  }

  async softDelete(id: string) {
    const result = await this.dbService.query(
      `UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!result.length) throw new NotFoundException('Course not found');
    return { success: true };
  }
}
