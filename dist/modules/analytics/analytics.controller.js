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
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const analytics_service_1 = require("./analytics.service");
const jwt_auth_guard_1 = require("../../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../../common/guards/roles.guard");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const swagger_1 = require("@nestjs/swagger");
let AnalyticsController = class AnalyticsController {
    constructor(analyticsService) {
        this.analyticsService = analyticsService;
    }
    getDashboard() {
        return this.analyticsService.getDashboard();
    }
    getStudentAnalytics(id) {
        return this.analyticsService.getStudentAnalytics(id);
    }
    getTeacherDashboard(req) {
        return this.analyticsService.getTeacherDashboard(req.user.id);
    }
    getMonthlyReport(year, month) {
        return this.analyticsService.getMonthlyAiReport(month, year);
    }
    getJobStatus(id) {
        return this.analyticsService.getAiJobStatus(id);
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Retrieve cached overall dashboard numbers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Aggregate system totals across DB tables.' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER', 'TEACHER'),
    (0, common_1.Get)('student/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Analyze single student presence and monetary progress' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Student UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Aggregated sums of presence and payments.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getStudentAnalytics", null);
__decorate([
    (0, roles_decorator_1.Roles)('TEACHER', 'ADMIN', 'MANAGER'),
    (0, common_1.Get)('teacher/dashboard'),
    (0, swagger_1.ApiOperation)({ summary: 'Teacher specific aggregate metrics including their specific groups, debtors and exams' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard metrics payload.' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getTeacherDashboard", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, common_1.Get)('monthly-report/:year/:month'),
    (0, swagger_1.ApiOperation)({ summary: 'Generate AI-powered monthly financial and growth report (Async)' }),
    (0, swagger_1.ApiParam)({ name: 'year', type: 'number', example: 2026 }),
    (0, swagger_1.ApiParam)({ name: 'month', type: 'number', example: 3 }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Stats with a jobId to track AI analysis.' }),
    __param(0, (0, common_1.Param)('year')),
    __param(1, (0, common_1.Param)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Number]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getMonthlyReport", null);
__decorate([
    (0, roles_decorator_1.Roles)('ADMIN', 'MANAGER'),
    (0, common_1.Get)('job-status/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Check status of a background AI job' }),
    (0, swagger_1.ApiParam)({ name: 'id', description: 'Job UUID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Job status and result if completed.' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AnalyticsController.prototype, "getJobStatus", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('analytics'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [analytics_service_1.AnalyticsService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map