import { Controller, Get, Param, UseGuards, Request, Res, ForbiddenException } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Permissions('ANALYTICS_VIEW')
  @Get('dashboard')
  @ApiOperation({ summary: 'Retrieve overall dashboard stats', description: 'Permissions: ANALYTICS_VIEW' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Permissions('STUDENT_READ')
  @Get('student/:id')
  @ApiOperation({ summary: 'Analyze single student progress', description: 'Permissions: STUDENT_READ' })
  getStudentAnalytics(@Param('id') id: string, @Request() req) {
    const targetId = id === 'me' ? req.user.id : id;
    if (req.user?.role === 'STUDENT' && targetId !== req.user.id) {
      throw new ForbiddenException("Faqat o'z statistikangizni ko'ra olasiz");
    }
    return this.analyticsService.getStudentAnalytics(targetId);
  }

  /** ANALYTICS_VIEW emas — ba’zi token/jWT holatlarda 403 bo‘lmasin; faqat CRM xodim rollari */
  @Roles('TEACHER', 'ADMIN', 'MANAGER')
  @Get('teacher/dashboard')
  @ApiOperation({
    summary: 'Teacher specific aggregate metrics',
    description: 'Rollar: TEACHER, ADMIN, MANAGER (o‘z ID bo‘yicha metrikalar)',
  })
  getTeacherDashboard(@Request() req) {
    return this.analyticsService.getTeacherDashboard(req.user.id);
  }

  @Permissions('AI_USE')
  @Get('monthly-report/:year/:month')
  @ApiOperation({ summary: 'Generate AI-powered monthly report', description: 'Permissions: AI_USE' })
  getMonthlyReport(@Param('year') year: number, @Param('month') month: number) {
    return this.analyticsService.getMonthlyAiReport(month, year);
  }

  @Permissions('AI_USE')
  @Get('job-status/:id')
  @ApiOperation({ summary: 'Check status of a background AI job', description: 'Permissions: AI_USE' })
  getJobStatus(@Param('id') id: string) {
    return this.analyticsService.getAiJobStatus(id);
  }

  @Permissions('ANALYTICS_VIEW')
  @Get('export/students')
  @ApiOperation({ summary: 'Export all students to CSV', description: 'Permissions: ANALYTICS_VIEW' })
  async exportStudents(@Res() res: Response) {
    const data = await this.analyticsService.getStudentsForExport();
    const esc = (v: unknown) => {
      const t = String(v ?? '');
      return /^[=+\-@\t\r]/.test(t) ? `'${t.replace(/'/g, "''")}'` : t;
    };
    const header = 'ID,First Name,Last Name,Phone,Created At\n';
    const rows = data
      .map((s: any) => [s.id, esc(s.first_name), esc(s.last_name), esc(s.phone), s.created_at].join(','))
      .join('\n');
    const csv = header + rows;
    res.header('Content-Type', 'text/csv');
    res.attachment('students_export.csv');
    return res.send(csv);
  }
}


