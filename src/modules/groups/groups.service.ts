import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class GroupsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    const { name, course_id, teacher_id } = data;
    const result = await this.dbService.query(
      `INSERT INTO groups (name, course_id, teacher_id) VALUES ($1, $2, $3) RETURNING *`,
      [name, course_id, teacher_id]
    );
    return result[0];
  }

  async addStudent(groupId: string, studentId: string) {
    // Pre-check for constraint: 1 student = 1 group per course
    const groupCheck = await this.dbService.query(
      `SELECT g.course_id FROM groups g WHERE g.id = $1`, [groupId]
    );
    if (!groupCheck.length) throw new NotFoundException('Group not found');
    const courseId = groupCheck[0].course_id;

    const conflictingGroups = await this.dbService.query(
      `SELECT gs.group_id 
       FROM group_students gs 
       JOIN groups g ON gs.group_id = g.id 
       WHERE gs.student_id = $1 AND g.course_id = $2`,
      [studentId, courseId]
    );

    if (conflictingGroups.length > 0) {
      throw new ConflictException('Student is already in another group for this course');
    }

    try {
      await this.dbService.query(
        `INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [studentId, courseId]
      );
      
      const result = await this.dbService.query(
        `INSERT INTO group_students (group_id, student_id) VALUES ($1, $2) RETURNING *`,
        [groupId, studentId]
      );
      return result[0];
    } catch (error) {
       throw new ConflictException('Student possibly already linked or missing foreign key.');
    }
  }

  async removeStudent(groupId: string, studentId: string) {
    await this.dbService.query(
      `DELETE FROM group_students WHERE group_id = $1 AND student_id = $2`,
      [groupId, studentId]
    );
    return { success: true };
  }

  async getStudents(groupId: string) {
    return this.dbService.query(
      `SELECT s.* FROM students s 
       JOIN group_students gs ON s.id = gs.student_id 
       WHERE gs.group_id = $1 AND s.deleted_at IS NULL`,
      [groupId]
    );
  }

  async update(id: string, data: any) {
    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (data.name) { updates.push(`name = $${queryIndex++}`); values.push(data.name); }
    if (data.course_id) { updates.push(`course_id = $${queryIndex++}`); values.push(data.course_id); }
    if (data.teacher_id) { updates.push(`teacher_id = $${queryIndex++}`); values.push(data.teacher_id); }

    if (updates.length === 0) return { success: false, message: 'Nothing to update' };
    values.push(id);
    const result = await this.dbService.query(
      `UPDATE groups SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`,
      values
    );
    if (!result.length) throw new NotFoundException('Group not found');
    return result[0];
  }

  async softDelete(id: string) {
    const result = await this.dbService.query(
      `UPDATE groups SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!result.length) throw new NotFoundException('Group not found');
    return { success: true };
  }
}
