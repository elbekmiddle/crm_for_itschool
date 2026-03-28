"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
const bcrypt = require("bcrypt");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
let UsersService = class UsersService {
    constructor(dbService, cloudinaryService) {
        this.dbService = dbService;
        this.cloudinaryService = cloudinaryService;
    }
    async create(data) {
        const { email, password, role } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await this.dbService.query(`INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`, [email, hashedPassword, role || 'TEACHER']);
        return result[0];
    }
    async findAll() {
        return this.dbService.query(`SELECT id, first_name, last_name, avatar_url, email, role, created_at FROM users WHERE deleted_at IS NULL`);
    }
    async findOne(id) {
        const result = await this.dbService.query(`SELECT id, first_name, last_name, avatar_url, email, role, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('User not found');
        return result[0];
    }
    async update(id, data, file) {
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
        if (updates.length === 0)
            return { success: false, message: 'Nothing to update' };
        values.push(id);
        const result = await this.dbService.query(`UPDATE users SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING id, first_name, last_name, avatar_url, email, role`, values);
        if (!result.length)
            throw new common_1.NotFoundException('User not found');
        return result[0];
    }
    async softDelete(id) {
        const result = await this.dbService.query(`UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('User not found');
        return { success: true };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService, cloudinary_service_1.CloudinaryService])
], UsersService);
//# sourceMappingURL=users.service.js.map