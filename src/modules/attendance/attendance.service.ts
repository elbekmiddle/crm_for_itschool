import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { get_group_attendance } from './queries/get_group_attendance';
import { mark_attendance } from './commands/mark_attendance';
import { update_attendance } from './commands/update_attendance';

@Injectable()
export class AttendanceService {
  constructor(private readonly dbService: DbService) {}

  async markAttendance(data: any) {
    return mark_attendance(this.dbService, data);
  }

  async getGroupAttendance(groupId: string) {
    return get_group_attendance(this.dbService, groupId);
  }

  async update(id: string, status: string) {
    return update_attendance(this.dbService, id, status);
  }
}

