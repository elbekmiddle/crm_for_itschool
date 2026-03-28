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
const all_students_1 = require("./queries/all_students");
const get_student_1 = require("./queries/get_student");
const create_student_1 = require("./commands/create_student");
const update_student_1 = require("./commands/update_student");
const delete_student_1 = require("./commands/delete_student");
const enroll_student_1 = require("./commands/enroll_student");
let StudentsService = class StudentsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(createStudentDto, createdBy) {
        return (0, create_student_1.create_student)(this.dbService, createStudentDto, createdBy);
    }
    async findAll(page = 1, limit = 20) {
        return (0, all_students_1.all_students)(this.dbService, page, limit);
    }
    async findOne(id) {
        return (0, get_student_1.get_student)(this.dbService, id);
    }
    async update(id, updateStudentDto) {
        return (0, update_student_1.update_student)(this.dbService, id, updateStudentDto);
    }
    async remove(id) {
        return (0, delete_student_1.delete_student)(this.dbService, id);
    }
    async enroll(id, courseId) {
        return (0, enroll_student_1.enroll_student)(this.dbService, id, courseId);
    }
};
exports.StudentsService = StudentsService;
exports.StudentsService = StudentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], StudentsService);
//# sourceMappingURL=students.service.js.map