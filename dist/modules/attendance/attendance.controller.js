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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
const create_attendance_dto_1 = require("./dto/create-attendance.dto");
let AttendanceController = class AttendanceController {
    constructor(attendanceService) {
        this.attendanceService = attendanceService;
    }
    markAttendance(body) {
        return this.attendanceService.markAttendance(body);
    }
    getGroupAttendance(id) {
        return this.attendanceService.getGroupAttendance(id);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'TEACHER'),
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark attendance for a given student' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                group_id: { type: 'string', example: 'uuid-group' },
                student_id: { type: 'string', example: 'uuid-student' },
                status: { type: 'string', example: 'PRESENT' },
                lesson_id: { type: 'string', example: 'uuid-lesson', description: 'Optional ID explicitly matching lesson' }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Attendance logged successfully.' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Conflict: Attendance for this student on this day already recorded.' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_attendance_dto_1.CreateAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "markAttendance", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'TEACHER'),
    (0, common_1.Get)('group/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get full attendance trace for a group' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Group UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Attendance log array matching group scope.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "getGroupAttendance", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, swagger_1.ApiTags)('attendance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('attendance'),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map