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
const all_payments_1 = require("./queries/all_payments");
const get_student_payments_raw_1 = require("./queries/get_student_payments_raw");
const create_payment_1 = require("./commands/create_payment");
const delete_payment_1 = require("./commands/delete_payment");
let PaymentsService = class PaymentsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        return (0, create_payment_1.create_payment)(this.dbService, data);
    }
    async getStudentPayments(studentId) {
        const payments = await (0, get_student_payments_raw_1.get_student_payments_raw)(this.dbService, studentId);
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
    async findAll() {
        return (0, all_payments_1.all_payments)(this.dbService);
    }
    async remove(id) {
        return (0, delete_payment_1.delete_payment)(this.dbService, id);
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map