import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DbModule } from './infrastructure/database/db.module';
import { AuthModule } from './modules/auth/auth.module';
import { StudentsModule } from './modules/students/students.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { GroupsModule } from './modules/groups/groups.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AiModule } from './modules/ai/ai.module';
import { RedisModule } from './infrastructure/redis/redis.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { ExamsModule } from './modules/exams/exams.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { CloudinaryModule } from './modules/cloudinary/cloudinary.module';
import { TelegramModule } from './infrastructure/notifications/telegram.module';
import { SocketsModule } from './modules/sockets/sockets.module';

import { APP_INTERCEPTOR, APP_GUARD, APP_FILTER } from '@nestjs/core';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';
import { RootController } from './root.controller';
import { ThrottlerGuard } from '@nestjs/throttler';
import { LeadsModule } from './modules/leads/leads.module';
import { VacanciesModule } from './modules/vacancies/vacancies.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    DbModule,
    AuthModule,
    StudentsModule,
    UsersModule,
    CoursesModule,
    GroupsModule,
    AttendanceModule,
    PaymentsModule,
    AnalyticsModule,
    AiModule,
    RedisModule,
    QueueModule,
    ExamsModule,
    LessonsModule,
    QuestionsModule,
    CloudinaryModule,
    TelegramModule,
    SocketsModule,
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    LeadsModule,
    VacanciesModule,
    BlogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
  controllers: [RootController],
})
export class AppModule {}
