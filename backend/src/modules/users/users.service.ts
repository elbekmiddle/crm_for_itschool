import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { all_users } from './queries/all_users';
import { get_user } from './queries/get_user';
import { create_user } from './commands/create_user';
import { user_update } from './commands/user_update';
import { delete_user } from './commands/delete_user';
import { syncTeacherCourses } from './commands/sync_teacher_courses';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService, private readonly cloudinaryService: CloudinaryService) {}

  async create(data: any) {
    const { course_ids, ...rest } = data;
    const user = await create_user(this.dbService, rest);
    await syncTeacherCourses(this.dbService, user.id, user.role, course_ids, { skipIfUndefined: false });
    return user;
  }

  async findAll() {
    return all_users(this.dbService);
  }

  async findOne(id: string) {
    return get_user(this.dbService, id);
  }

  async update(id: string, data: any) {
    const { course_ids, ...rest } = data;
    let row: any = await user_update(this.dbService, id, rest);
    if (row && typeof row === 'object' && 'success' in row && row.success === false) {
      row = await get_user(this.dbService, id);
    }
    const finalRole = rest.role !== undefined ? rest.role : row.role;
    /** Kurslar faqat `course_ids` yoki `role` kelganda sinxronlanadi (faqat email o'zgarganda eski biriktirishlar saqlanadi). */
    const shouldSyncCourses = course_ids !== undefined || rest.role !== undefined;
    if (shouldSyncCourses) {
      await syncTeacherCourses(this.dbService, id, finalRole, course_ids, { skipIfUndefined: false });
    }
    return row;
  }

  async softDelete(id: string) {
    return delete_user(this.dbService, id);
  }

  async uploadPhoto(id: string, file: Express.Multer.File) {
    const result = await this.cloudinaryService.uploadImage(file);
    const photo_url = result.secure_url;
    await this.update(id, { photo_url });
    return { photo_url };
  }
}
