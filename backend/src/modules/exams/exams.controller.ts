import { Controller, Get, Post, Body, Param, UseGuards, Request, Patch, Delete } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { CreateExamDto } from './dto/create-exam.dto';
import { GradeExamDto } from './dto/grade-exam.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('exams')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Permissions('EXAM_MANAGE')
  @Get()
  @ApiOperation({ summary: 'List all exams', description: 'Permissions: EXAM_MANAGE' })
  findAll(@Request() req) {
    return this.examsService.findAll(req.user);
  }

  /** O‘qituvchi: imtihon + bog‘langan savollar (GET /exams/:id talabada EXAM_PASS talab qiladi). */
  @Permissions('EXAM_MANAGE')
  @Get('manage/:examId')
  @ApiOperation({ summary: 'Imtihon batafsil + savollar (tahrir / tekshirish)' })
  getExamForManage(@Param('examId') examId: string) {
    return this.examsService.findOne(examId);
  }

  @Permissions('EXAM_MANAGE')
  @Post()
  @ApiOperation({ summary: 'Create a new exam', description: 'Permissions: EXAM_MANAGE' })
  create(@Body() createExamDto: CreateExamDto, @Request() req) {
    return this.examsService.create(createExamDto, req.user.id, req.user.role);
  }

  @Permissions('EXAM_MANAGE')
  @Patch(':id')
  @ApiOperation({ summary: 'Update exam details', description: 'Permissions: EXAM_MANAGE' })
  update(@Param('id') id: string, @Body() data: any) {
    return this.examsService.update(id, data);
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/questions')
  @ApiOperation({ summary: 'Assign specific questions to an exam', description: 'Permissions: EXAM_MANAGE' })
  addQuestions(@Param('id') examId: string, @Body('question_ids') questionIds: string[]) {
    return this.examsService.addQuestionsToExam(examId, questionIds);
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/questions/new')
  @ApiOperation({ summary: 'Create a new question and add to exam', description: 'Permissions: EXAM_MANAGE' })
  addNewQuestion(@Param('id') examId: string, @Body() body: any, @Request() req) {
    return this.examsService.addNewQuestion(examId, { ...body, teacherId: req.user.id });
  }

  @Permissions('EXAM_MANAGE')
  @Delete(':id/questions/:questionId')
  @ApiOperation({ summary: 'Remove a question from an exam', description: 'Permissions: EXAM_MANAGE' })
  removeQuestion(@Param('id') examId: string, @Param('questionId') questionId: string) {
    return this.examsService.removeQuestionFromExam(examId, questionId);
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish exam to students', description: 'Permissions: EXAM_MANAGE' })
  publish(@Param('id') id: string, @Request() req) {
    return this.examsService.publishExam(id, req.user);
  }

  @Permissions('EXAM_MANAGE')
  @Patch(':id/questions/:questionId')
  @ApiOperation({ summary: 'Update a specific question in an exam', description: 'Permissions: EXAM_MANAGE' })
  updateQuestion(@Param('id') examId: string, @Param('questionId') questionId: string, @Body() data: any) {
    return this.examsService.updateQuestion(examId, questionId, data);
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/questions/:questionId/approve')
  @ApiOperation({ summary: 'Approve a single AI generated question', description: 'Permissions: EXAM_MANAGE' })
  approveQuestion(@Param('id') examId: string, @Param('questionId') questionId: string) {
    return this.examsService.updateQuestion(examId, questionId, { status: 'approved' });
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/approve-all')
  @ApiOperation({ summary: 'Approve all draft questions in an exam', description: 'Permissions: EXAM_MANAGE' })
  approveAllQuestions(@Param('id') examId: string) {
    return this.examsService.approveAllQuestions(examId);
  }

  @Permissions('EXAM_MANAGE')
  @Post(':id/ai-generate')
  @ApiOperation({ summary: 'AI generates questions and attaches to exam', description: 'Permissions: EXAM_MANAGE' })
  generateAiExam(@Param('id') examId: string, @Body() body: { lesson_id: string; topic: string; level: string; count: number }, @Request() req) {
    return this.examsService.generateAiExam(examId, body.lesson_id, body.topic, body.level, body.count, req.user.id);
  }

  // --- Student Endpoints ---

  @Permissions('EXAM_PASS')
  @Get('student/available')
  @ApiOperation({ summary: 'Get available exams for student', description: 'Permissions: EXAM_PASS' })
  getAvailableExams(@Request() req) {
    return this.examsService.getAvailableExams(req.user.id);
  }

  @Permissions('EXAM_PASS')
  @Post(':id/start')
  @ApiOperation({ summary: 'Start a new exam session', description: 'Permissions: EXAM_PASS' })
  startExamAttempt(@Param('id') id: string, @Request() req) {
    return this.examsService.startExamAttempt(id, req.user.id);
  }

  @Permissions('EXAM_PASS')
  @Get('attempt/:attemptId/questions')
  @ApiOperation({ summary: 'Get questions for an attempt', description: 'Permissions: EXAM_PASS' })
  getAttemptQuestions(@Param('attemptId') attemptId: string) {
    return this.examsService.getAttemptQuestions(attemptId);
  }

  @Permissions('EXAM_PASS')
  @Post('attempt/:attemptId/answer')
  @ApiOperation({ summary: 'Save/Autosave answer', description: 'Permissions: EXAM_PASS' })
  saveAnswer(@Param('attemptId') attemptId: string, @Body() body: { question_id: string; answer_payload: any; client_time?: number }) {
    return this.examsService.saveAnswer(attemptId, body.question_id, body.answer_payload, body.client_time);
  }

  @Permissions('EXAM_PASS')
  @Post('attempt/:attemptId/submit')
  @ApiOperation({ summary: 'Submit exam session', description: 'Permissions: EXAM_PASS' })
  submitExamAttempt(@Param('attemptId') attemptId: string) {
    return this.examsService.submitExamAttempt(attemptId);
  }

  @Permissions('EXAM_PASS')
  @Get('attempt/:attemptId/result')
  @ApiOperation({ summary: 'Get exam result', description: 'Permissions: EXAM_PASS' })
  getAttemptResult(@Param('attemptId') attemptId: string) {
    return this.examsService.getAttemptResult(attemptId);
  }

  @Permissions('EXAM_PASS')
  @Get('attempt/:attemptId/answers')
  @ApiOperation({ summary: 'Get already saved answers for an attempt', description: 'Permissions: EXAM_PASS' })
  getAttemptAnswers(@Param('attemptId') attemptId: string) {
    return this.examsService.getAttemptAnswers(attemptId);
  }

  @Permissions('EXAM_PASS')
  @Get(':id/active-attempt')
  @ApiOperation({ summary: 'Check for an active ongoing attempt for an exam', description: 'Permissions: EXAM_PASS' })
  getActiveAttempt(@Param('id') examId: string, @Request() req) {
    return this.examsService.getActiveAttempt(examId, req.user.id);
  }

  /** `GET :id` oxirida — `attempt` va boshqa statik segmentlar bilan chalkashmasin */
  @Permissions('EXAM_PASS')
  @Get(':id')
  @ApiOperation({ summary: 'Get specific exam details', description: 'Permissions: EXAM_PASS' })
  getExamDetails(@Param('id') id: string) {
    return this.examsService.findOne(id);
  }

  @Permissions('EXAM_MANAGE')
  @Get('course/:courseId')
  @ApiOperation({ summary: 'List exams in a course', description: 'Permissions: EXAM_MANAGE' })
  findAllByCourse(@Param('courseId') courseId: string) {
    return this.examsService.findAllByCourse(courseId);
  }

  @Permissions('EXAM_MANAGE')
  @Get(':id/results')
  @ApiOperation({ summary: 'Get all results for an exam', description: 'Permissions: EXAM_MANAGE' })
  getExamResults(@Param('id') id: string) {
    return this.examsService.getExamResults(id);
  }

  @Permissions('EXAM_MANAGE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete an exam', description: 'Permissions: EXAM_MANAGE' })
  remove(@Param('id') id: string) {
    return this.examsService.remove(id);
  }
}
