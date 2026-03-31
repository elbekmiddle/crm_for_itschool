import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
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
  @Get()
  @ApiOperation({ summary: 'List all exams' })
  findAll() {
    return this.examsService.findAll();
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post()
  @ApiOperation({ summary: 'Create a new exam' })
  create(@Body() createExamDto: CreateExamDto, @Request() req) {
    return this.examsService.create(createExamDto, req.user.id);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Patch(':id')
  @ApiOperation({ summary: 'Update exam details' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.examsService.update(id, data);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post(':id/questions')
  @ApiOperation({ summary: 'Assign specific questions to an exam' })
  addQuestions(@Param('id') examId: string, @Body('question_ids') questionIds: string[]) {
    return this.examsService.addQuestionsToExam(examId, questionIds);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Remove a question from an exam' })
  removeQuestion(@Param('id') examId: string, @Param('questionId') questionId: string) {
    return this.examsService.removeQuestionFromExam(examId, questionId);
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish exam to students' })
  publish(@Param('id') id: string) {
    return this.examsService.update(id, { status: 'published' });
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post(':id/ai-generate')
  @ApiOperation({ summary: 'AI generates questions and attaches to exam' })
  generateAiExam(@Param('id') examId: string, @Body() body: { lesson_id: string; topic: string; level: string; count: number }, @Request() req) {
    return this.examsService.generateAiExam(examId, body.lesson_id, body.topic, body.level, body.count, req.user.id);
  }

  // --- Student Endpoints ---

  @Get('student/available')
  @ApiOperation({ summary: 'Get available exams for current logged in student' })
  getAvailableExams(@Request() req) {
    return this.examsService.getAvailableExams(req.user.id);
  }

  @Roles('STUDENT', 'ADMIN', 'MANAGER', 'TEACHER')
  @Get('results/student/:studentId')
  @ApiOperation({ summary: 'Get all exam results for a specific student' })
  getStudentResults(@Param('studentId') studentId: string, @Request() req) {
    const targetId = studentId === 'me' ? req.user.id : studentId;
    return this.examsService.getStudentResults(targetId);
  }

  @Post(':id/start')
  @ApiOperation({ summary: 'Start a specific exam session (attempt)' })
  startExamAttempt(@Param('id') examId: string, @Request() req) {
    return this.examsService.startExamAttempt(examId, req.user.id);
  }

  @Get('attempt/:attemptId/questions')
  @ApiOperation({ summary: 'Get questions for an active exam attempt session (shuffled, no answers)' })
  getAttemptQuestions(@Param('attemptId') attemptId: string) {
    return this.examsService.getAttemptQuestions(attemptId);
  }

  @Post('attempt/:attemptId/answer')
  @ApiOperation({ summary: 'Save/Autosave a single answer for a question in the session' })
  saveAnswer(@Param('attemptId') attemptId: string, @Body() body: { question_id: string; answer_payload: any }) {
    return this.examsService.saveAnswer(attemptId, body.question_id, body.answer_payload);
  }

  @Post('attempt/:attemptId/submit')
  @ApiOperation({ summary: 'Finalize and submit the entire exam session' })
  submitExamAttempt(@Param('attemptId') attemptId: string) {
    return this.examsService.submitExamAttempt(attemptId);
  }

  @Get('attempt/:attemptId/result')
  @ApiOperation({ summary: 'Get results of a submitted exam attempt' })
  getAttemptResult(@Param('attemptId') attemptId: string) {
    return this.examsService.getAttemptResult(attemptId);
  }

  @Get('course/:courseId')
  @ApiOperation({ summary: 'List exams in a course (for Admin/Teacher)' })
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.examsService.findAllByCourse(courseId);
  }

  @Get(':id/results')
  @ApiOperation({ summary: 'Get all student results for a specific exam' })
  getExamResults(@Param('id') id: string) {
    return this.examsService.getExamResults(id);
  }
}
