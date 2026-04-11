import { Injectable, UnauthorizedException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_groups } from './queries/all_groups';
import { get_group_students } from './queries/get_group_students';
import { create_group } from './commands/create_group';
import { add_student_to_group } from './commands/add_student_to_group';
import { remove_student_from_group } from './commands/remove_student_from_group';
import { update_group } from './commands/update_group';
import { soft_delete_group } from './commands/soft_delete_group';
import { get_teacher_debtors } from './queries/get_teacher_debtors';
import { teacher_students_without_group } from './queries/teacher_students_without_group';
import { get_group_lesson_log } from './queries/get_group_lesson_log';
import { upsert_group_lesson_log } from './commands/upsert_group_lesson_log';
import { SocketsGateway } from '../sockets/sockets.gateway';

@Injectable()
export class GroupsService {
  constructor(
    private readonly dbService: DbService,
    private readonly socketsGateway: SocketsGateway,
  ) {}

  async create(data: any) {
    const row = await create_group(this.dbService, data);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'created' });
    return row;
  }

  async addStudent(groupId: string, studentId: string) {
    const row = await add_student_to_group(this.dbService, groupId, studentId);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'student_added' });
    return row;
  }

  async removeStudent(groupId: string, studentId: string) {
    const row = await remove_student_from_group(this.dbService, groupId, studentId);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'student_removed' });
    return row;
  }

  async getStudents(groupId: string) {
    return get_group_students(this.dbService, groupId);
  }

  async update(id: string, data: any) {
    const row = await update_group(this.dbService, id, data);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'updated' });
    return row;
  }

  async softDelete(id: string) {
    const row = await soft_delete_group(this.dbService, id);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'deleted' });
    return row;
  }

  async findAll() {
    return all_groups(this.dbService);
  }

  async findTeacherGroups(teacherId: string) {
    try {
      return await this.dbService.query(
        `SELECT g.*, c.name AS course_name,
                COALESCE(gs.cnt, 0)::int AS student_count
         FROM groups g
         LEFT JOIN courses c ON c.id = g.course_id
         LEFT JOIN (
           SELECT group_id, COUNT(*)::int AS cnt
           FROM group_students
           WHERE left_at IS NULL
           GROUP BY group_id
         ) gs ON gs.group_id = g.id
         WHERE g.teacher_id = $1 AND g.deleted_at IS NULL
         ORDER BY g.created_at DESC`,
        [teacherId],
      );
    } catch (e: any) {
      if (e?.code === '42703') {
        return this.dbService.querySafe(
          `SELECT g.*, c.name AS course_name,
                  COALESCE(gs.cnt, 0)::int AS student_count
           FROM groups g
           LEFT JOIN courses c ON c.id = g.course_id
           LEFT JOIN (
             SELECT group_id, COUNT(*)::int AS cnt FROM group_students GROUP BY group_id
           ) gs ON gs.group_id = g.id
           WHERE g.teacher_id = $1
           ORDER BY g.created_at DESC`,
          [teacherId],
          [],
        );
      }
      throw e;
    }
  }

  async getTeacherDebtors(teacherId: string) {
    return get_teacher_debtors(this.dbService, teacherId);
  }

  /** Davomat: guruhga kirmagan, lekin ustozning kursiga yozilgan talabalar */
  async findTeacherStudentsWithoutGroup(teacherId: string) {
    return teacher_students_without_group(this.dbService, teacherId);
  }

  async isGroupOwner(groupId: string, teacherId: string): Promise<boolean> {
    const group = await this.dbService.query(`SELECT teacher_id FROM groups WHERE id = $1`, [groupId]);
    if (!group.length || group[0].teacher_id == null) return false;
    return String(group[0].teacher_id) === String(teacherId);
  }

  async getLessonLog(groupId: string, lessonDate: string) {
    try {
      return await get_group_lesson_log(this.dbService, groupId, lessonDate);
    } catch {
      return null;
    }
  }

  async saveLessonLog(groupId: string, lessonDate: string, topic: string | null, teacherId: string) {
    const ok = await this.isGroupOwner(groupId, teacherId);
    if (!ok) throw new UnauthorizedException('Faqat o‘z guruhlaringiz uchun mavzu saqlash mumkin');
    const row = await upsert_group_lesson_log(this.dbService, groupId, lessonDate, topic);
    this.socketsGateway.emitDashboardRefresh({ source: 'group', action: 'lesson_log' });
    return row;
  }
}

