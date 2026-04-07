import { Controller, Get, Post, Body, Param, UseGuards, Patch, Delete, Request } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';

@ApiTags('courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Permissions('COURSE_CREATE')
  @Post()
  @ApiOperation({ summary: 'Create a new course', description: 'Permissions: COURSE_CREATE' })
  create(@Body() body: CreateCourseDto, @Request() req: { user: { id: string; role: string } }) {
    return this.coursesService.create(body, req.user);
  }

  @Permissions('COURSE_READ')
  @Get()
  @ApiOperation({ summary: 'Get all courses', description: 'Permissions: COURSE_READ' })
  findAll() {
    return this.coursesService.findAll();
  }

  @Permissions('COURSE_READ')
  @Get(':id')
  @ApiOperation({ summary: 'Get course by ID', description: 'Permissions: COURSE_READ' })
  findOne(@Param('id') id: string) {
    return this.coursesService.findOne(id);
  }

  @Permissions('STUDENT_READ')
  @Get(':id/students')
  @ApiOperation({ summary: 'Get all students in a course', description: 'Permissions: STUDENT_READ' })
  getStudents(@Param('id') id: string) {
    return this.coursesService.getStudents(id);
  }

  @Permissions('COURSE_UPDATE')
  @Patch(':id')
  @ApiOperation({ summary: 'Update course details', description: 'Permissions: COURSE_UPDATE' })
  update(@Param('id') id: string, @Body() body: UpdateCourseDto) {
    return this.coursesService.update(id, body);
  }

  @Permissions('COURSE_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a course', description: 'Permissions: COURSE_DELETE' })
  remove(@Param('id') id: string) {
    return this.coursesService.softDelete(id);
  }
}
