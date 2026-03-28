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
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const db_service_1 = require("../../infrastructure/database/db.service");
const cloudinary_service_1 = require("../cloudinary/cloudinary.service");
const all_users_1 = require("./queries/all_users");
const get_user_1 = require("./queries/get_user");
const create_user_1 = require("./commands/create_user");
const user_update_1 = require("./commands/user_update");
const delete_user_1 = require("./commands/delete_user");
let UsersService = class UsersService {
    constructor(dbService, cloudinaryService) {
        this.dbService = dbService;
        this.cloudinaryService = cloudinaryService;
    }
    async create(data) {
        return (0, create_user_1.create_user)(this.dbService, data);
    }
    async findAll() {
        return (0, all_users_1.all_users)(this.dbService);
    }
    async findOne(id) {
        return (0, get_user_1.get_user)(this.dbService, id);
    }
    async update(id, data) {
        return (0, user_update_1.user_update)(this.dbService, id, data);
    }
    async softDelete(id) {
        return (0, delete_user_1.delete_user)(this.dbService, id);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [db_service_1.DbService, cloudinary_service_1.CloudinaryService])
], UsersService);
//# sourceMappingURL=users.service.js.map