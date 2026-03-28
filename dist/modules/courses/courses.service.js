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
exports.CoursesService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
let CoursesService = class CoursesService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        const { name, price } = data;
        const result = await this.dbService.query(`INSERT INTO courses (name, price) VALUES ($1, $2) RETURNING *`, [name, price]);
        return result[0];
    }
    async findAll() {
        return this.dbService.query(`SELECT * FROM courses ORDER BY created_at DESC`);
    }
    async findOne(id) {
        const result = await this.dbService.query(`SELECT * FROM courses WHERE id = $1`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('Course not found');
        return result[0];
    }
    async getStudents(courseId) {
        const query = `
      SELECT 
        s.id, 
        s.first_name, 
        s.last_name, 
        s.phone,
        CASE WHEN gs.group_id IS NOT NULL THEN 'GROUP' ELSE 'INDIVIDUAL' END as study_type,
        g.name as group_name
      FROM students s
      JOIN student_courses sc ON sc.student_id = s.id
      LEFT JOIN group_students gs ON gs.student_id = s.id
      LEFT JOIN groups g ON g.id = gs.group_id AND g.course_id = sc.course_id
      WHERE sc.course_id = $1 AND s.deleted_at IS NULL
      ORDER BY study_type, s.first_name
    `;
        return this.dbService.query(query, [courseId]);
    }
    async update(id, data) {
        const updates = [];
        const values = [];
        let queryIndex = 1;
        if (data.name) {
            updates.push(`name = $${queryIndex++}`);
            values.push(data.name);
        }
        if (data.price !== undefined) {
            updates.push(`price = $${queryIndex++}`);
            values.push(data.price);
        }
        if (updates.length === 0)
            return { success: false, message: 'Nothing to update' };
        values.push(id);
        const result = await this.dbService.query(`UPDATE courses SET ${updates.join(', ')} WHERE id = $${queryIndex} AND deleted_at IS NULL RETURNING *`, values);
        if (!result.length)
            throw new common_1.NotFoundException('Course not found');
        return result[0];
    }
    async softDelete(id) {
        const result = await this.dbService.query(`UPDATE courses SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]);
        if (!result.length)
            throw new common_1.NotFoundException('Course not found');
        return { success: true };
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map