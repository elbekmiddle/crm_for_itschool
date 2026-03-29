import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('students', 'ADMIN', 'MANAGER', 'TEACHER')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('MANAGER')
  @Post()
  @ApiOperation({ summary: 'Create a new student [MANAGER ONLY]' })
  @ApiResponse({ status: 201, description: 'Student created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Managers can create students.' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of students with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated students list.' })
  findAll(@Query('page') page: string, @Query('limit') limit: string, @Request() req) {
    const { user } = req;
    return this.studentsService.findAll(+page || 1, +limit || 20, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Return student object.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Roles('MANAGER')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student [MANAGER ONLY]' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student updated successfully.' })
  update(@Param('id') id: string, @Body() updateStudentDto: UpdateStudentDto) {
    return this.studentsService.update(id, updateStudentDto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a student' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Student deleted successfully.' })
  remove(@Param('id') id: string) {
    return this.studentsService.remove(id);
  }

  @Roles('MANAGER')
  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a student into a course [MANAGER ONLY]' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully.' })
  enroll(@Param('id') id: string, @Body('course_id') courseId: string) {
    return this.studentsService.enroll(id, courseId);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Get(':id/dashboard')
  @ApiOperation({ summary: 'Get student dashboard with AI humor status and charts data' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Return student dashboard data.' })
  getDashboard(@Param('id') id: string) {
    return this.studentsService.getDashboard(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('find-similar')
  @ApiOperation({ summary: 'Check for potential duplicate students with similar names (Soft Detection)' })
  @ApiQuery({ name: 'first_name', required: true })
  @ApiQuery({ name: 'last_name', required: true })
  findSimilar(@Query('first_name') firstName: string, @Query('last_name') lastName: string) {
    return this.studentsService.findSimilar(firstName, lastName);
  }

  @Roles('MANAGER')
  @Post(':id/transfer-course')
  @ApiOperation({ summary: 'Transfer student from one course to another [MANAGER ONLY]' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  transferCourse(@Param('id') id: string, @Body('old_course_id') oldCourseId: string, @Body('new_course_id') newCourseId: string) {
    return this.studentsService.transferCourse(id, oldCourseId, newCourseId);
  }

  @Roles('MANAGER')
  @Post(':id/transfer-group')
  @ApiOperation({ summary: 'Transfer student from one group to another [MANAGER ONLY]' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  transferGroup(@Param('id') id: string, @Body('old_group_id') oldGroupId: string, @Body('new_group_id') newGroupId: string) {
    return this.studentsService.transferGroup(id, oldGroupId, newGroupId);
  }
}
