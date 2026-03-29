import { Controller, Get, Param, UseGuards, Request, Res } from '@nestjs/common';
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';

@ApiTags('analytics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Get('dashboard')
  @ApiOperation({ summary: 'Retrieve cached overall dashboard numbers' })
  @ApiResponse({ status: 200, description: 'Aggregate system totals across DB tables.' })
  getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Get('student/:id')
  @ApiOperation({ summary: 'Analyze single student presence and monetary progress' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Aggregated sums of presence and payments.' })
  getStudentAnalytics(@Param('id') id: string) {
    return this.analyticsService.getStudentAnalytics(id);
  }

  @Roles('TEACHER', 'ADMIN', 'MANAGER')
  @Get('teacher/dashboard')
  @ApiOperation({ summary: 'Teacher specific aggregate metrics including their specific groups, debtors and exams' })
  @ApiResponse({ status: 200, description: 'Dashboard metrics payload.' })
  getTeacherDashboard(@Request() req) {
    return this.analyticsService.getTeacherDashboard(req.user.id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('monthly-report/:year/:month')
  @ApiOperation({ summary: 'Generate AI-powered monthly financial and growth report (Async)' })
  @ApiParam({ name: 'year', type: 'number', example: 2026 })
  @ApiParam({ name: 'month', type: 'number', example: 3 })
  @ApiResponse({ status: 200, description: 'Stats with a jobId to track AI analysis.' })
  getMonthlyReport(@Param('year') year: number, @Param('month') month: number) {
    return this.analyticsService.getMonthlyAiReport(month, year);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('job-status/:id')
  @ApiOperation({ summary: 'Check status of a background AI job' })
  @ApiParam({ name: 'id', description: 'Job UUID' })
  @ApiResponse({ status: 200, description: 'Job status and result if completed.' })
  getJobStatus(@Param('id') id: string) {
    return this.analyticsService.getAiJobStatus(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('export/students')
  @ApiOperation({ summary: 'Export all students to CSV' })
  @ApiResponse({ status: 200, description: 'CSV file download.' })
  async exportStudents(@Res() res: Response) {
    const data = await this.analyticsService.getStudentsForExport();
    
    // Simple CSV generation
    const header = 'ID,First Name,Last Name,Phone,Created At\n';
    const rows = data.map(s => `${s.id},${s.first_name},${s.last_name},${s.phone},${s.created_at}`).join('\n');
    const csv = header + rows;

    res.header('Content-Type', 'text/csv');
    res.attachment('students_export.csv');
    return res.send(csv);
  }
}


