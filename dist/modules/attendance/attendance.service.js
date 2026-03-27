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
exports.AttendanceService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
let AttendanceService = class AttendanceService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async markAttendance(data) {
        const { group_id, student_id, status, lesson_date } = data;
        try {
            const result = await this.dbService.query(`INSERT INTO attendance (group_id, student_id, lesson_date, status) 
         VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4) RETURNING *`, [group_id, student_id, lesson_date || null, status]);
            return result[0];
        }
        catch (error) {
            throw new common_1.ConflictException('Attendance already marked for this student today');
        }
    }
    async getGroupAttendance(groupId) {
        return this.dbService.query(`SELECT * FROM attendance WHERE group_id = $1 ORDER BY lesson_date DESC`, [groupId]);
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map