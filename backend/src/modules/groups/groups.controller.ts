import { Controller, Get, Post, Body, Param, Delete, UseGuards, Patch, Request } from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@ApiTags('groups [ADMIN, MANAGER, TEACHER]')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  
  @Get()
  @ApiOperation({ summary: 'List all groups' })
  @ApiResponse({ status: 200, description: 'Returns all groups.' })
  findAll() {
    return this.groupsService.findAll();
  }


  @Roles('ADMIN', 'MANAGER')
  @Post()
  @ApiOperation({ summary: 'Create a new class group [ADMIN, MANAGER ONLY]' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', example: 'RN-1' },
        course_id: { type: 'string', example: 'uuid-course' },
        teacher_id: { type: 'string', example: 'uuid-teacher' },
        capacity: { type: 'number', example: 20 }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Group created successfully.' })
  create(@Body() body: CreateGroupDto, @Request() req) {
    return this.groupsService.create(body);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post(':id/add-student')
  @ApiOperation({ summary: 'Add a student to a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ schema: { type: 'object', properties: { student_id: { type: 'string', example: 'uuid-student' } } } })
  @ApiResponse({ status: 201, description: 'Student linked successfully.' })
  @ApiResponse({ status: 409, description: 'Constraint violation: Student already in a group for this course or duplicating assignment.' })
  async addStudent(@Param('id') id: string, @Body('student_id') studentId: string, @Request() req) {
    if (req.user.role === 'TEACHER') {
      const isOwner = await this.groupsService.isGroupOwner(id, req.user.id);
      if (!isOwner) throw new Error('You can only manage students in your own groups');
    }
    return this.groupsService.addStudent(id, studentId);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Delete(':id/remove-student')
  @ApiOperation({ summary: 'Remove a student from a group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiBody({ schema: { type: 'object', properties: { student_id: { type: 'string', example: 'uuid-student' } } } })
  @ApiResponse({ status: 200, description: 'Student successfully unlinked.' })
  async removeStudent(@Param('id') id: string, @Body('student_id') studentId: string, @Request() req) {
    if (req.user.role === 'TEACHER') {
      const isOwner = await this.groupsService.isGroupOwner(id, req.user.id);
      if (!isOwner) throw new Error('You can only manage students in your own groups');
    }
    return this.groupsService.removeStudent(id, studentId);
  }

  @Get(':id/students')
  @ApiOperation({ summary: 'Retrieve all students listed under a specific group' })
  @ApiParam({ name: 'id', description: 'Group UUID' })
  @ApiResponse({ status: 200, description: 'Students list array.' })
  getStudents(@Param('id') id: string) {
    return this.groupsService.getStudents(id);
  }

  @Roles('TEACHER')
  @Get('my-groups')
  @ApiOperation({ summary: 'Get groups managed by the logged-in teacher' })
  findMyGroups(@Request() req) {
    return this.groupsService.findTeacherGroups(req.user.id);
  }

  @Roles('TEACHER')
  @Get('debtors')
  @ApiOperation({ summary: 'Get debtors (students with late payments) in teacher groups' })
  getDebtors(@Request() req) {
    return this.groupsService.getTeacherDebtors(req.user.id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Patch(':id')
  @ApiOperation({ summary: 'Update group details' })
  update(@Param('id') id: string, @Body() body: UpdateGroupDto) {
    return this.groupsService.update(id, body);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete a group' })
  remove(@Param('id') id: string) {
    return this.groupsService.softDelete(id);
  }
}
