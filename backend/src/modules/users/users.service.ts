import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { all_users } from './queries/all_users';
import { get_user } from './queries/get_user';
import { create_user } from './commands/create_user';
import { user_update } from './commands/user_update';
import { delete_user } from './commands/delete_user';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService, private readonly cloudinaryService: CloudinaryService) {}

  async create(data: any) {
    return create_user(this.dbService, data);
  }

  async findAll() {
    return all_users(this.dbService);
  }

  async findOne(id: string) {
    return get_user(this.dbService, id);
  }

  async update(id: string, data: any) {
    return user_update(this.dbService, id, data);
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
