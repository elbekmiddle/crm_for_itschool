import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  @ApiOperation({ summary: 'Create a new class group' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'RN-1' },
        course_id: { type: 'string', example: 'uuid-course' },
        teacher_id: { type: 'string', example: 'uuid-teacher' }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  create(@Body() body: CreateGroupDto) {
    return this.groupsService.create(body);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post(':id/add-student')
  @ApiOperation({ summary: 'Add a student to a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ schema: { type: 'object', properties: { student_id: { type: 'string', example: 'uuid-student' } } } })
  @ApiResponse({ status: 201, description: 'Student linked successfully.' })
  @ApiResponse({ status: 409, description: 'Constraint violation: Student already in a group for this course or duplicating assignment.' })
  addStudent(@Param('id') id: string, @Body('student_id') studentId: string) {
    return this.groupsService.addStudent(id, studentId);
  }

  @Roles('ADMIN', 'MANAGER')
  @Delete(':id/remove-student')
  @ApiOperation({ summary: 'Remove a student from a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ schema: { type: 'object', properties: { student_id: { type: 'string', example: 'uuid-student' } } } })
  @ApiResponse({ status: 200, description: 'Student successfully unlinked.' })
  removeStudent(@Param('id') id: string, @Body('student_id') studentId: string) {
    return this.groupsService.removeStudent(id, studentId);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Retrieve all students listed under a specific group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200, description: 'Students list array.' })
  getStudents(@Param('id') id: string) {
    return this.groupsService.getStudents(id);
  }
}
