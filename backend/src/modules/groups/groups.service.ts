import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_groups } from './queries/all_groups';
import { get_group_students } from './queries/get_group_students';
import { create_group } from './commands/create_group';
import { add_student_to_group } from './commands/add_student_to_group';
import { remove_student_from_group } from './commands/remove_student_from_group';
import { update_group } from './commands/update_group';
import { soft_delete_group } from './commands/soft_delete_group';
import { get_teacher_debtors } from './queries/get_teacher_debtors';
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
    return this.dbService.query(
      `SELECT g.*, (SELECT COUNT(*) FROM group_students gs WHERE gs.group_id = g.id) as student_count
       FROM groups g 
       WHERE g.teacher_id = $1 AND g.deleted_at IS NULL`,
      [teacherId]
    );
  }

  async getTeacherDebtors(teacherId: string) {
    return get_teacher_debtors(this.dbService, teacherId);
  }

  async isGroupOwner(groupId: string, teacherId: string): Promise<boolean> {
    const group = await this.dbService.query(`SELECT teacher_id FROM groups WHERE id = $1`, [groupId]);
    return group.length > 0 && group[0].teacher_id === teacherId;
  }
}

