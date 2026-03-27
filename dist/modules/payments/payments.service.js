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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
let PaymentsService = class PaymentsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        const { student_id, course_id, amount } = data;
        const result = await this.dbService.query(`INSERT INTO payments (student_id, course_id, amount) VALUES ($1, $2, $3) RETURNING *`, [student_id, course_id, amount]);
        return result[0];
    }
    async getStudentPayments(studentId) {
        const payments = await this.dbService.query(`SELECT * FROM payments WHERE student_id = $1 ORDER BY paid_at DESC`, [studentId]);
        let status = 'ACTIVE';
        if (payments.length > 0) {
            const lastPaymentDate = new Date(payments[0].paid_at);
            const daysSince = Math.floor((new Date().getTime() - lastPaymentDate.getTime()) / (1000 * 3600 * 24));
            if (daysSince > 60) {
                status = 'FROZEN';
            }
        }
        else {
            status = 'PENDING';
        }
        return { status, payments };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map