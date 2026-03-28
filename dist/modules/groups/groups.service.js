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
const all_groups_1 = require("./queries/all_groups");
const get_group_students_1 = require("./queries/get_group_students");
const create_group_1 = require("./commands/create_group");
const add_student_to_group_1 = require("./commands/add_student_to_group");
const remove_student_from_group_1 = require("./commands/remove_student_from_group");
const update_group_1 = require("./commands/update_group");
const soft_delete_group_1 = require("./commands/soft_delete_group");
let GroupsService = class GroupsService {
    constructor(dbService) {
        this.dbService = dbService;
    }
    async create(data) {
        return (0, create_group_1.create_group)(this.dbService, data);
    }
    async addStudent(groupId, studentId) {
        return (0, add_student_to_group_1.add_student_to_group)(this.dbService, groupId, studentId);
    }
    async removeStudent(groupId, studentId) {
        return (0, remove_student_from_group_1.remove_student_from_group)(this.dbService, groupId, studentId);
    }
    async getStudents(groupId) {
        return (0, get_group_students_1.get_group_students)(this.dbService, groupId);
    }
    async update(id, data) {
        return (0, update_group_1.update_group)(this.dbService, id, data);
    }
    async softDelete(id) {
        return (0, soft_delete_group_1.soft_delete_group)(this.dbService, id);
    }
    async findAll() {
        return (0, all_groups_1.all_groups)(this.dbService);
    }
};
exports.GroupsService = GroupsService;
exports.GroupsService = GroupsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], GroupsService);
//# sourceMappingURL=groups.service.js.map