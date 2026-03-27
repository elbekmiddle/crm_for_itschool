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
let UsersService = class UsersService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        const { email, password, role } = data;
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await this.dbService.query(`INSERT INTO users (email, password, role) VALUES ($1, $2, $3) RETURNING id, email, role, created_at`, [email, hashedPassword, role || 'TEACHER']);
        return result[0];
    }
    async findAll() {
        return this.dbService.query(`SELECT id, email, role, created_at FROM users WHERE deleted_at IS NULL`);
    }
    async findOne(id) {
        const result = await this.dbService.query(`SELECT id, email, role, created_at FROM users WHERE id = $1 AND deleted_at IS NULL`, [id]);
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
    __metadata("design:paramtypes", [db_service_1.DbService])
], UsersService);
//# sourceMappingURL=users.service.js.map