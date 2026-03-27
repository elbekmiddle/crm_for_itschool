import { Controller, Get, Param, UseGuards } from '@nestjs/common';
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
}
