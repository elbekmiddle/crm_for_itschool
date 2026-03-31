import { Injectable, BadRequestException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { all_students } from './queries/all_students';
import { get_student } from './queries/get_student';
import { create_student } from './commands/create_student';
import { update_student } from './commands/update_student';
import { delete_student } from './commands/delete_student';

import { enroll_student } from './commands/enroll_student';
import { get_student_dashboard } from './queries/get_student_dashboard';
import { AiService } from '../ai/ai.service';

@Injectable()
export class StudentsService {
  constructor(
    private readonly dbService: DbService,
    private readonly aiService: AiService
  ) {}

  async create(createStudentDto: CreateStudentDto, createdBy: string) {
    return create_student(this.dbService, createStudentDto, createdBy);
  }

  async findAll(page: number = 1, limit: number = 20, user?: any) {
    return all_students(this.dbService, page, limit, user);
  }

  async findOne(id: string) {
    return get_student(this.dbService, id);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    return update_student(this.dbService, id, updateStudentDto);
  }

  async remove(id: string) {
    return delete_student(this.dbService, id);
  }

  async enroll(id: string, courseId: string) {
    return enroll_student(this.dbService, id, courseId);
  }

  async getDashboard(id: string) {
    const data = await get_student_dashboard(this.dbService, id);
    if (!data) return null;

    // Add AI humor status
    const humor = await this.aiService.getStudentHumorStatus({
      present_days: data.present_days,
      absent_days: data.absent_days,
      last_payment: data.payments[0]?.paid_at,
      name: data.first_name
    });

    return { ...data, ai_status: humor };
  }

  async transferCourse(id: string, oldCourseId: string, newCourseId: string) {
    await this.dbService.query('BEGIN');
    try {
      // 1. Close old course
      await this.dbService.query(
        `UPDATE student_courses SET status = 'transferred', ended_at = NOW() 
         WHERE student_id = $1 AND course_id = $2 AND status = 'active'`,
        [id, oldCourseId]
      );

      // 2. Remove from active group in that course
      await this.dbService.query(
        `UPDATE group_students SET left_at = NOW() 
         WHERE student_id = $1 AND group_id IN (SELECT id FROM groups WHERE course_id = $2)`,
        [id, oldCourseId]
      );

      // 3. Enroll in new course
      const enrollment = await this.enroll(id, newCourseId);

      await this.dbService.query('COMMIT');
      return { success: true, enrollment };
    } catch (error) {
      await this.dbService.query('ROLLBACK');
      throw error;
    }
  }

  async transferGroup(id: string, oldGroupId: string, newGroupId: string) {
    // Rule: must be same course
    const courses = await this.dbService.query(
      `SELECT course_id FROM groups WHERE id IN ($1, $2)`,
      [oldGroupId, newGroupId]
    );

    if (courses.length < 2 || courses[0].course_id !== courses[1].course_id) {
       throw new BadRequestException('Group transfer must be within the same course.');
    }

    await this.dbService.query('BEGIN');
    try {
      // 1. Leave old group
      await this.dbService.query(
        `UPDATE group_students SET left_at = NOW() WHERE student_id = $1 AND group_id = $2`,
        [id, oldGroupId]
      );

      // 2. Join new group
      const result = await this.dbService.query(
        `INSERT INTO group_students (student_id, group_id) VALUES ($1, $2) RETURNING *`,
        [id, newGroupId]
      );

      await this.dbService.query('COMMIT');
      return result[0];
    } catch (error) {
      await this.dbService.query('ROLLBACK');
      throw error;
    }
  }

  async findSimilar(firstName: string, lastName: string) {
    const firstNameSnippet = firstName.substring(0, 3);
    const lastNameSnippet = lastName.substring(0, 3);
    return this.dbService.query(
      `SELECT id, first_name, last_name, phone, status 
       FROM students 
       WHERE (first_name ILIKE $1 OR last_name ILIKE $2) 
         AND deleted_at IS NULL 
       LIMIT 5`,
      [`%${firstNameSnippet}%`, `%${lastNameSnippet}%`]
    );
  }

  async getAttendance(studentId: string) {
    const records = await this.dbService.query(
      `SELECT 
         a.id,
         a.student_id,
         a.status,
         a.notes,
         a.lesson_date,
         a.created_at,
         g.name AS group_name,
         c.name AS course_name
       FROM attendance a
       LEFT JOIN groups g ON a.group_id = g.id
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE a.student_id = $1
       ORDER BY a.lesson_date DESC NULLS LAST, a.created_at DESC`,
      [studentId]
    );

    const present = records.filter((r: any) => r.status === 'PRESENT').length;
    const absent = records.filter((r: any) => r.status === 'ABSENT').length;
    const total = records.length;

    return {
      records,
      stats: {
        total_lessons: total,
        present_count: present,
        absent_count: absent,
        attendance_percentage: total > 0 ? Math.round((present / total) * 100) : 0,
      },
    };
  }

  async getNotifications(studentId: string) {
    return this.dbService.query(
      `SELECT * FROM notifications WHERE student_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [studentId]
    );
  }

  async markNotificationRead(id: string, studentId: string) {
    return this.dbService.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND student_id = $2`,
      [id, studentId]
    );
  }

  async getStats(studentId: string) {
    const dashboard = await this.getDashboard(studentId);
    if (!dashboard) return null;

    const totalExams = dashboard.exams?.length || 0;
    const avgScore = totalExams > 0 
      ? Math.round(dashboard.exams.reduce((acc: number, ex: any) => acc + (ex.score || 0), 0) / totalExams)
      : 0;

    const totalPayments = dashboard.payments?.reduce((acc: number, p: any) => acc + (p.amount || 0), 0) || 0;

    return {
      total_exams: totalExams,
      average_score: avgScore,
      attendance_percentage: dashboard.attendance_percentage || 0,
      missed_lessons: dashboard.absent_days || 0,
      total_payments: totalPayments,
      ai_status: dashboard.ai_status
    };
  }
}

