import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { GradeExamDto } from './dto/grade-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  @ApiResponse({ status: 201, description: 'Exam created.' })
  create(@Body() createExamDto: CreateExamDto, @Request() req) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post(':id/grade')
  @ApiOperation({ summary: 'Grade students for this exam' })
  @ApiResponse({ status: 201, description: 'Grades successfully processed.' })
  gradeExam(@Param('id') id: string, @Body() gradeExamDto: GradeExamDto) {
    return this.examsService.gradeExam(id, gradeExamDto.grades);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List exams in a course' })
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.examsService.findAllByCourse(courseId);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get student results for an exam' })
  getExamResults(@Param('id') id: string) {
    return this.examsService.getExamResults(id);
  }
}
