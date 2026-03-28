import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateAttendanceDto } from './dto/create-attendance.dto';

@ApiTags('attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post()
  @ApiOperation({ summary: 'Mark attendance for a given student' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        group_id: { type: 'string', example: 'uuid-group' },
        student_id: { type: 'string', example: 'uuid-student' },
        status: { type: 'string', example: 'PRESENT' },
        lesson_id: { type: 'string', example: 'uuid-lesson', description: 'Optional ID explicitly matching lesson' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Attendance logged successfully.' })
  @ApiResponse({ status: 409, description: 'Conflict: Attendance for this student on this day already recorded.' })
  markAttendance(@Body() body: CreateAttendanceDto) {
    return this.attendanceService.markAttendance(body);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Get('group/:id')
  @ApiOperation({ summary: 'Get full attendance trace for a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200, description: 'Attendance log array matching group scope.' })
  getGroupAttendance(@Param('id') id: string) {
    return this.attendanceService.getGroupAttendance(id);
  }
}
