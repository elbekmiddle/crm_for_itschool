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
exports.GroupsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
let GroupsService = class GroupsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        const { name, course_id, teacher_id } = data;
        const result = await this.dbService.query(`INSERT INTO groups (name, course_id, teacher_id) VALUES ($1, $2, $3) RETURNING *`, [name, course_id, teacher_id]);
        return result[0];
    }
    async addStudent(groupId, studentId) {
        const groupCheck = await this.dbService.query(`SELECT g.course_id FROM groups g WHERE g.id = $1`, [groupId]);
        if (!groupCheck.length)
            throw new common_1.NotFoundException('Group not found');
        const courseId = groupCheck[0].course_id;
        const conflictingGroups = await this.dbService.query(`SELECT gs.group_id 
       FROM group_students gs 
       JOIN groups g ON gs.group_id = g.id 
       WHERE gs.student_id = $1 AND g.course_id = $2`, [studentId, courseId]);
        if (conflictingGroups.length > 0) {
            throw new common_1.ConflictException('Student is already in another group for this course');
        }
        try {
            await this.dbService.query(`INSERT INTO student_courses (student_id, course_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`, [studentId, courseId]);
            const result = await this.dbService.query(`INSERT INTO group_students (group_id, student_id) VALUES ($1, $2) RETURNING *`, [groupId, studentId]);
            return result[0];
        }
        catch (error) {
            throw new common_1.ConflictException('Student possibly already linked or missing foreign key.');
        }
    }
    async removeStudent(groupId, studentId) {
        await this.dbService.query(`DELETE FROM group_students WHERE group_id = $1 AND student_id = $2`, [groupId, studentId]);
        return { success: true };
    }
    async getStudents(groupId) {
        return this.dbService.query(`SELECT s.* FROM students s 
       JOIN group_students gs ON s.id = gs.student_id 
       WHERE gs.group_id = $1 AND s.deleted_at IS NULL`, [groupId]);
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map