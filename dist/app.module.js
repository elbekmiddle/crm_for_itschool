"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const db_module_1 = require("./infrastructure/database/db.module");
const auth_module_1 = require("./modules/auth/auth.module");
const students_module_1 = require("./modules/students/students.module");
const users_module_1 = require("./modules/users/users.module");
const courses_module_1 = require("./modules/courses/courses.module");
const groups_module_1 = require("./modules/groups/groups.module");
const attendance_module_1 = require("./modules/attendance/attendance.module");
const payments_module_1 = require("./modules/payments/payments.module");
const analytics_module_1 = require("./modules/analytics/analytics.module");
const ai_module_1 = require("./modules/ai/ai.module");
const redis_module_1 = require("./infrastructure/redis/redis.module");
const queue_module_1 = require("./infrastructure/queue/queue.module");
const throttler_1 = require("@nestjs/throttler");
const exams_module_1 = require("./modules/exams/exams.module");
const lessons_module_1 = require("./modules/lessons/lessons.module");
const questions_module_1 = require("./modules/questions/questions.module");
const cloudinary_module_1 = require("./modules/cloudinary/cloudinary.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            db_module_1.DbModule,
            auth_module_1.AuthModule,
            students_module_1.StudentsModule,
            users_module_1.UsersModule,
            courses_module_1.CoursesModule,
            groups_module_1.GroupsModule,
            attendance_module_1.AttendanceModule,
            payments_module_1.PaymentsModule,
            analytics_module_1.AnalyticsModule,
            ai_module_1.AiModule,
            redis_module_1.RedisModule,
            queue_module_1.QueueModule,
            exams_module_1.ExamsModule,
            lessons_module_1.LessonsModule,
            questions_module_1.QuestionsModule,
            cloudinary_module_1.CloudinaryModule,
            throttler_1.ThrottlerModule.forRoot([{
                    ttl: 60000,
                    limit: 100,
                }]),
        ],
        providers: [
            {
                provide: 'APP_GUARD',
                useClass: require('@nestjs/throttler').ThrottlerGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map