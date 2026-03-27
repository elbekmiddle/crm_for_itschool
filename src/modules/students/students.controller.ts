import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';

@ApiTags('students')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  @ApiResponse({ status: 201, description: 'Student created successfully.' })
  create(@Body() createStudentDto: CreateStudentDto, @Request() req) {
    return this.studentsService.create(createStudentDto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get list of students with pagination' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page' })
  @ApiResponse({ status: 200, description: 'Returns paginated students list.' })
  findAll(@Query('page') page: string, @Query('limit') limit: string) {
    return this.studentsService.findAll(+page || 1, +limit || 20);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Return student object.' })
  @ApiResponse({ status: 404, description: 'Student not found.' })
  findOne(@Param('id') id: string) {
    return this.studentsService.findOne(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
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

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/enroll')
  @ApiOperation({ summary: 'Enroll a student into a course independently' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 201, description: 'Student enrolled successfully.' })
  enroll(@Param('id') id: string, @Body('course_id') courseId: string) {
    return this.studentsService.enroll(id, courseId);
  }
}
