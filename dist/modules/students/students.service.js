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
exports.StudentsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
let StudentsService = class StudentsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(createStudentDto, createdBy) {
        const { first_name, last_name, phone } = createStudentDto;
        const result = await this.dbService.query(`INSERT INTO students (first_name, last_name, phone, created_by) 
       VALUES ($1, $2, $3, $4) RETURNING *`, [first_name, last_name, phone, createdBy]);
        return result[0];
    }
    async findAll(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.dbService.query(`SELECT * FROM students WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
            this.dbService.query(`SELECT COUNT(*) FROM students WHERE deleted_at IS NULL`)
        ]);
        return {
            data,
            meta: {
                total: parseInt(total[0].count, 10),
                page,
                limit,
                totalPages: Math.ceil(parseInt(total[0].count, 10) / limit)
            }
        };
    }
    async findOne(id) {
        const result = await this.dbService.query(`SELECT * FROM students WHERE id = $1 AND deleted_at IS NULL`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('Student not found');
        return result[0];
    }
    async update(id, updateStudentDto) {
        const { first_name, last_name, phone } = updateStudentDto;
        const updates = [];
        const values = [];
        let queryIdx = 1;
        if (first_name) {
            updates.push(`first_name = $${queryIdx++}`);
            values.push(first_name);
        }
        if (last_name) {
            updates.push(`last_name = $${queryIdx++}`);
            values.push(last_name);
        }
        if (phone) {
            updates.push(`phone = $${queryIdx++}`);
            values.push(phone);
        }
        if (!updates.length)
            return this.findOne(id);
        values.push(id);
        const query = `UPDATE students SET ${updates.join(', ')} WHERE id = $${queryIdx} AND deleted_at IS NULL RETURNING *`;
        const result = await this.dbService.query(query, values);
        if (!result.length)
            throw new common_1.NotFoundException('Student not found');
        return result[0];
    }
    async remove(id) {
        const result = await this.dbService.query(`UPDATE students SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('Student not found');
        return { success: true };
    }
    async enroll(studentId, courseId) {
        try {
            const result = await this.dbService.query(`INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2) ON CONFLICT (student_id, course_id) DO NOTHING RETURNING *`, [studentId, courseId]);
            if (!result.length) {
                throw new common_1.ConflictException('Student is already enrolled in this course');
            }
            return result[0];
        }
        catch (error) {
            if (error instanceof common_1.ConflictException)
                throw error;
            throw new common_1.ConflictException('Failed to enroll: Verify course and student exist.');
        }
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], StudentsService);
//# sourceMappingURL=students.service.js.map