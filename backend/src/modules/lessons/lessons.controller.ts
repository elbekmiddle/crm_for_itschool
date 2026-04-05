import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Permissions('COURSE_UPDATE')
  @Post()
  @ApiOperation({ summary: 'Create a new lesson', description: 'Permissions: COURSE_UPDATE' })
  create(@Body() body: CreateLessonDto) {
    return this.lessonsService.create(body);
  }

  @Permissions('COURSE_READ')
  @Get('course/:id')
  @ApiOperation({ summary: 'Get all lessons for a course', description: 'Permissions: COURSE_READ' })
  findByCourse(@Param('id') id: string) {
    return this.lessonsService.findByCourse(id);
  }
}
