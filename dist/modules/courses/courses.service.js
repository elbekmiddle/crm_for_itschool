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
};
exports.CoursesService = CoursesService;
exports.CoursesService = CoursesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService])
], CoursesService);
//# sourceMappingURL=courses.service.js.map