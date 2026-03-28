import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateLessonDto } from './dto/create-lesson.dto';

@ApiTags('lessons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post()
  @ApiOperation({ summary: 'Create a new lesson outline for a course' })
  @ApiResponse({ status: 201, description: 'Lesson successfully created.' })
  create(@Body() body: CreateLessonDto) {
    return this.lessonsService.create(body);
  }

  @Get('course/:id')
  @ApiOperation({ summary: 'Get all lessons belonging to a specific course' })
  @ApiResponse({ status: 200, description: 'List of lessons returned.' })
  findByCourse(@Param('id') id: string) {
    return this.lessonsService.findByCourse(id);
  }
}
