import { Injectable } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { all_groups } from './queries/all_groups';
import { get_group_students } from './queries/get_group_students';
import { create_group } from './commands/create_group';
import { add_student_to_group } from './commands/add_student_to_group';
import { remove_student_from_group } from './commands/remove_student_from_group';
import { update_group } from './commands/update_group';
import { soft_delete_group } from './commands/soft_delete_group';

@Injectable()
export class GroupsService {
  constructor(private readonly dbService: DbService) {}

  async create(data: any) {
    return create_group(this.dbService, data);
  }

  async addStudent(groupId: string, studentId: string) {
    return add_student_to_group(this.dbService, groupId, studentId);
  }

  async removeStudent(groupId: string, studentId: string) {
    return remove_student_from_group(this.dbService, groupId, studentId);
  }

  async getStudents(groupId: string) {
    return get_group_students(this.dbService, groupId);
  }

  async update(id: string, data: any) {
    return update_group(this.dbService, id, data);
  }

  async softDelete(id: string) {
    return soft_delete_group(this.dbService, id);
  }

  async findAll() {
    return all_groups(this.dbService);
  }
}

