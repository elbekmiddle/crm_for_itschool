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
var DbService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DbService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const fs = require("fs");
const path = require("path");
let DbService = DbService_1 = class DbService {
    constructor(pool) {
        this.pool = pool;
        this.logger = new common_1.Logger(DbService_1.name);
    }
    async onModuleInit() {
        this.logger.log('Starting DB Initialization check...');
        try {
            const initSqlPath = path.join(process.cwd(), 'database', 'init.sql');
            const seedSqlPath = path.join(process.cwd(), 'database', 'seed.sql');
            if (fs.existsSync(initSqlPath)) {
                try {
                    const initSql = fs.readFileSync(initSqlPath, 'utf8');
                    await this.pool.query(initSql);
                    this.logger.log('✔ init.sql schema executed automatically.');
                }
                catch (e) {
                    this.logger.warn(`init.sql warning (ignoring): ${e.message}`);
                }
            }
            if (fs.existsSync(seedSqlPath)) {
                try {
                    const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
                    await this.pool.query(seedSql);
                    this.logger.log('✔ seed.sql executed automatically.');
                }
                catch (e) {
                    this.logger.warn(`seed.sql warning (ignoring): ${e.message}`);
                }
            }
        }
        catch (err) {
            this.logger.error('Database connection failed totally.', err.message);
        }
    }
    async query(queryText, values) {
        this.logger.debug(`Executing query: ${queryText}`);
        const result = await this.pool.query(queryText, values);
        return result.rows;
    }
    async getClient() {
        return await this.pool.connect();
    }
};
exports.DbService = DbService;
exports.DbService = DbService = DbService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('DATABASE_POOL')),
    __metadata("design:paramtypes", [pg_1.Pool])
], DbService);
//# sourceMappingURL=db.service.js.map