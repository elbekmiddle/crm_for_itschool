import { Controller, Get, Post, Body, Param, UseGuards, Patch } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Permissions('ATTENDANCE_MARK')
  @Post()
  @ApiOperation({ summary: 'Mark attendance for a given student', description: 'Permissions: ATTENDANCE_MARK' })
  markAttendance(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.markAttendance(body);
  }

  @Permissions('ATTENDANCE_READ')
  @Get('group/:id')
  @ApiOperation({ summary: 'Get full attendance trace for a group', description: 'Permissions: ATTENDANCE_READ' })
  getGroupAttendance(@Param('id') id: string) {
    return this.attendanceService.getGroupAttendance(id);
  }

  @Permissions('ATTENDANCE_MARK')
  @Patch(':id')
  @ApiOperation({ summary: 'Update attendance status', description: 'Permissions: ATTENDANCE_MARK' })
  update(@Param('id') id: string, @Body('status') status: string) {
    return this.attendanceService.update(id, status);
  }
}


