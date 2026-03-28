import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../../infrastructure/database/db.service';
import * as bcrypt from 'bcrypt';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(private readonly dbService: DbService, private readonly cloudinaryService: CloudinaryService) {}

  async create(data: any) {
    const { email, password, role } = data;
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await this.dbService.query(
      `INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`,
      [email, hashedPassword, role || 'TEACHER']
    );
    return result[0];
  }

  async findAll() {
    return this.dbService.query(`SELECT id, first_name, last_name, avatar_url, email, role, created_at FROM users WHERE deleted_at IS NULL`);
  }

  async findOne(id: string) {
    const result = await this.dbService.query(`SELECT id, first_name, last_name, avatar_url, email, role, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
    if (!result.length) throw new NotFoundException('User not found');
    return result[0];
  }

  async update(id: string, data: any, file?: Express.Multer.File) {
    const updates = [];
    const values = [];
    let queryIndex = 1;

    if (file) {
       const uploadRes = await this.cloudinaryService.uploadImage(file);
       if (uploadRes && uploadRes.secure_url) {
          updates.push(`avatar_url = $${queryIndex++}`);
          values.push(uploadRes.secure_url);
       }
    }

    if (data.first_name) {
      updates.push(`first_name = $${queryIndex++}`);
      values.push(data.first_name);
    }
    if (data.last_name) {
      updates.push(`last_name = $${queryIndex++}`);
      values.push(data.last_name);
    }
    
    if (data.email) {
      updates.push(`email = $${queryIndex++}`);
      values.push(data.email);
    }
    if (data.password) {
      updates.push(`password = $${queryIndex++}`);
      const hashedPassword = await bcrypt.hash(data.password, 10);
      values.push(hashedPassword);
    }
    if (data.role) {
      updates.push(`role = $${queryIndex++}`);
      values.push(data.role);
    }

    if (updates.length === 0) return { success: false, message: 'Nothing to update' };

    values.push(id);
    const result = await this.dbService.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING id, first_name, last_name, avatar_url, email, role`,
      values
    );
    if (!result.length) throw new NotFoundException('User not found');
    return result[0];
  }

  async softDelete(id: string) {
    const result = await this.dbService.query(
      `UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`,
      [id]
    );
    if (!result.length) throw new NotFoundException('User not found');
    return { success: true };
  }
}
