import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Permissions('STUDENT_READ')
  @Get('me')
  @ApiOperation({ summary: 'Get own profile', description: 'Permissions: STUDENT_READ' })
  getMe(@Request() req) {
    return this.studentsService.findOne(req.user.id);
  }

  @Permissions('STUDENT_READ')
  @Get('me/dashboard')
  @ApiOperation({ summary: 'Get own dashboard', description: 'Permissions: STUDENT_READ' })
  getMyDashboard(@Request() req) {
    return this.studentsService.getDashboard(req.user.id);
  }

  @Permissions('STUDENT_READ')
  @Get('me/stats')
  @ApiOperation({ summary: 'Get own stats summary', description: 'Permissions: STUDENT_READ' })
  getMyStats(@Request() req) {
    return this.studentsService.getStats(req.user.id);
  }

  @Permissions('ATTENDANCE_READ')
  @Get(':id/attendance')
  @ApiOperation({ summary: 'Get attendance records for a student', description: 'Permissions: ATTENDANCE_READ' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  getAttendance(@Param('id') id: string, @Request() req) {
    const studentId = req.user.role === 'STUDENT' ? req.user.id : id;
    return this.studentsService.getAttendance(studentId);
  }

  @Permissions('STUDENT_READ')
  @Get('me/notifications')
  @ApiOperation({ summary: 'Get notifications for current student', description: 'Permissions: STUDENT_READ' })
  getNotifications(@Request() req) {
    return this.studentsService.getNotifications(req.user.id);
  }

  @Permissions('STUDENT_READ')
  @Patch('me/notifications/:id/read')
  @ApiOperation({ summary: 'Mark notification as read', description: 'Permissions: STUDENT_READ' })
  markNotificationRead(@Param('id') id: string, @Request() req) {
    return this.studentsService.markNotificationRead(id, req.user.id);
  }

  @Permissions('STUDENT_CREATE')
  @Post()
  @ApiOperation({ summary: 'Create a new student', description: 'Permissions: STUDENT_CREATE' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.id);
  }

  @Permissions('STUDENT_READ')
  @Get()
  @ApiOperation({ summary: 'Get list of students with pagination', description: 'Permissions: STUDENT_READ' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(@Query('page') page: string, @Query('limit') limit: string, @Request() req) {
    return this.studentsService.findAll(+page || 1, +limit || 20, req.user);
  }

  @Permissions('STUDENT_READ')
  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID', description: 'Permissions: STUDENT_READ' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Permissions('STUDENT_UPDATE')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student', description: 'Permissions: STUDENT_UPDATE' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Permissions('STUDENT_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a student', description: 'Permissions: STUDENT_DELETE' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Permissions('STUDENT_ENROLL')
  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a student in a course', description: 'Permissions: STUDENT_ENROLL' })
  enroll(@Param('id') id: string, @Body('course_id') courseId: string) {
    return this.studentsService.enroll(id, courseId);
  }

  @Permissions('STUDENT_READ')
  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get student dashboard with AI humor status and charts data', description: 'Permissions: STUDENT_READ' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  getDashboard(@Param('id') id: string, @Request() req) {
    const studentId = req.user.role === 'STUDENT' ? req.user.id : id;
    return this.studentsService.getDashboard(studentId);
  }

  @Permissions('STUDENT_READ')
  @Get('find-similar')
  @ApiOperation({ summary: 'Check for potential duplicate students', description: 'Permissions: STUDENT_READ' })
  @ApiQuery({ name: 'first_name', required: true })
  @ApiQuery({ name: 'last_name', required: true })
  findSimilar(@Query('first_name') firstName: string, @Query('last_name') lastName: string) {
    return this.studentsService.findSimilar(firstName, lastName);
  }

  @Permissions('STUDENT_UPDATE')
  @Post(':id/transfer-course')
  @ApiOperation({ summary: 'Transfer student from one course to another', description: 'Permissions: STUDENT_UPDATE' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  transferCourse(@Param('id') id: string, @Body('old_course_id') oldCourseId: string, @Body('new_course_id') newCourseId: string) {
    return this.studentsService.transferCourse(id, oldCourseId, newCourseId);
  }

  @Permissions('STUDENT_UPDATE')
  @Post(':id/transfer-group')
  @ApiOperation({ summary: 'Transfer student from one group to another', description: 'Permissions: STUDENT_UPDATE' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  transferGroup(@Param('id') id: string, @Body('old_group_id') oldGroupId: string, @Body('new_group_id') newGroupId: string) {
    return this.studentsService.transferGroup(id, oldGroupId, newGroupId);
  }
}
