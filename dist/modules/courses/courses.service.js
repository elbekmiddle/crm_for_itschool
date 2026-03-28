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
const all_courses_1 = require("./queries/all_courses");
const get_course_1 = require("./queries/get_course");
const get_course_students_1 = require("./queries/get_course_students");
const create_course_1 = require("./commands/create_course");
const update_course_1 = require("./commands/update_course");
const delete_course_1 = require("./commands/delete_course");
let CoursesService = class CoursesService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        return (0, create_course_1.create_course)(this.dbService, data);
    }
    async findAll() {
        return (0, all_courses_1.all_courses)(this.dbService);
    }
    async findOne(id) {
        return (0, get_course_1.get_course)(this.dbService, id);
    }
    async getStudents(courseId) {
        return (0, get_course_students_1.get_course_students)(this.dbService, courseId);
    }
    async update(id, data) {
        return (0, update_course_1.update_course)(this.dbService, id, data);
    }
    async softDelete(id) {
        return (0, delete_course_1.delete_course)(this.dbService, id);
    }
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map