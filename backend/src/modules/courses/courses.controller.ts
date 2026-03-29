import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses', 'ADMIN', 'MANAGER', 'TEACHER')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Roles('ADMIN')
  @Post()
  @ApiOperation({ summary: 'Create a new course [ADMIN ONLY]' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: { name: { type: 'string', example: 'Vue.js Basics' }, price: { type: 'number', example: 120.00 } }
    }
  })
  @ApiResponse({ status: 201, description: 'Course created successfully.' })
  @ApiResponse({ status: 403, description: 'Forbidden: Only Admins can modify courses.' })
  create(@Body() body: CreateCourseDto) {
    return this.coursesService.create(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all courses' })
  @ApiResponse({ status: 200, description: 'Return all courses lists.' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Return course object.' })
  @ApiResponse({ status: 404, description: 'Course not found.' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students in a course (Grouped & Individual)' })
  @ApiParam({ name: 'id', description: 'Course UUID' })
  @ApiResponse({ status: 200, description: 'Return list of students with their study types.' })
  getStudents(@Param('id') id: string) {
    return this.coursesService.getStudents(id);
  }

  @Roles('ADMIN')
  @Patch(':id')
  @ApiOperation({ summary: 'Update course details [ADMIN ONLY]' })
  update(@Param('id') id: string, @Body() body: UpdateCourseDto) {
    return this.coursesService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a course' })
  remove(@Param('id') id: string) {
    return this.coursesService.softDelete(id);
  }
}
