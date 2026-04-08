import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Patch,
  Request,
  UnauthorizedException,
  ForbiddenException,
  Query,
} from '@nestjs/common';
import { GroupsService } from './groups.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';

@ApiTags('groups')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}
  
  @Permissions('GROUP_READ')
  @Get()
  @ApiOperation({ summary: 'List all groups', description: 'Permissions: GROUP_READ' })
  findAll() {
    return this.groupsService.findAll();
  }

  @Permissions('GROUP_READ')
  @Get('my-groups')
  @ApiOperation({ summary: 'Get groups for current teacher', description: 'Permissions: GROUP_READ' })
  findMyGroups(@Request() req) {
    return this.groupsService.findTeacherGroups(req.user.id);
  }

  @Permissions('STUDENT_READ')
  @Get('debtors')
  @ApiOperation({ summary: 'Get debtors in teacher groups', description: 'Permissions: STUDENT_READ' })
  getDebtors(@Request() req) {
    return this.groupsService.getTeacherDebtors(req.user.id);
  }

  @Permissions('GROUP_CREATE')
  @Post()
  @ApiOperation({ summary: 'Create a new group', description: 'Permissions: GROUP_CREATE' })
  create(@Body() body: CreateGroupDto, @Request() req: any) {
    // IT School: guruhni faqat o‘qituvchi yaratadi (admin/manager faqat ko‘radi)
    if (req.user?.role !== 'TEACHER') {
      throw new ForbiddenException('Guruhni faqat o‘qituvchi yaratishi mumkin');
    }
    return this.groupsService.create(body);
  }

  @Permissions('GROUP_UPDATE')
  @Post(':id/add-student')
  @ApiOperation({ summary: 'Add a student to a group', description: 'Permissions: GROUP_UPDATE' })
  async addStudent(@Param('id') id: string, @Body('student_id') studentId: string, @Request() req) {
    if (req.user.role !== 'TEACHER') {
      throw new ForbiddenException("Guruhga talaba faqat o'qituvchi tomonidan qo'shiladi");
    }
    const isOwner = await this.groupsService.isGroupOwner(id, req.user.id);
    if (!isOwner) throw new UnauthorizedException('Siz faqat o\'z guruhlaringizni boshqara olasiz');
    return this.groupsService.addStudent(id, studentId);
  }

  @Permissions('GROUP_UPDATE')
  @Delete(':id/remove-student')
  @ApiOperation({ summary: 'Remove a student from a group', description: 'Permissions: GROUP_UPDATE' })
  async removeStudent(@Param('id') id: string, @Body('student_id') studentId: string, @Request() req) {
    if (req.user.role !== 'TEACHER') {
      throw new ForbiddenException("Guruhdan talaba faqat o'qituvchi tomonidan chiqariladi");
    }
    const isOwner = await this.groupsService.isGroupOwner(id, req.user.id);
    if (!isOwner) throw new UnauthorizedException('Siz faqat o\'z guruhlaringizni boshqara olasiz');
    return this.groupsService.removeStudent(id, studentId);
  }

  @Permissions('GROUP_READ')
  @Get(':id/students')
  @ApiOperation({ summary: 'Get students in a group', description: 'Permissions: GROUP_READ' })
  getStudents(@Param('id') id: string) {
    return this.groupsService.getStudents(id);
  }

  @Permissions('GROUP_READ')
  @Get(':id/lesson-log')
  @ApiOperation({ summary: 'Kunlik dars mavzusi', description: 'Permissions: GROUP_READ' })
  getLessonLog(@Param('id') id: string, @Query('date') date: string) {
    return this.groupsService.getLessonLog(id, date || new Date().toISOString().slice(0, 10));
  }

  @Permissions('GROUP_UPDATE')
  @Post(':id/lesson-log')
  @ApiOperation({ summary: 'Kunlik dars mavzusini saqlash', description: 'Permissions: GROUP_UPDATE' })
  async saveLessonLog(
    @Param('id') id: string,
    @Body() body: { lesson_date?: string; topic?: string | null },
    @Request() req: any,
  ) {
    if (req.user?.role !== 'TEACHER') {
      throw new ForbiddenException('Mavzuni faqat o‘qituvchi saqlashi mumkin');
    }
    const lessonDate = body.lesson_date || new Date().toISOString().slice(0, 10);
    return this.groupsService.saveLessonLog(id, lessonDate, body.topic ?? null, req.user.id);
  }

  @Permissions('GROUP_UPDATE')
  @Patch(':id')
  @ApiOperation({ summary: 'Update group details', description: 'Permissions: GROUP_UPDATE' })
  update(@Param('id') id: string, @Body() body: UpdateGroupDto, @Request() req: any) {
    if (req.user?.role !== 'TEACHER') {
      throw new ForbiddenException('Guruhni faqat o‘qituvchi tahrirlashi mumkin');
    }
    return this.groupsService.update(id, body);
  }

  @Permissions('GROUP_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a group', description: 'Permissions: GROUP_DELETE' })
  remove(@Param('id') id: string, @Request() req: any) {
    if (req.user?.role !== 'TEACHER') {
      throw new ForbiddenException('Guruhni faqat o‘qituvchi o‘chirishi mumkin');
    }
    return this.groupsService.softDelete(id);
  }
}
