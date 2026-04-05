import { Controller, Get, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
import { QuestionsService } from './questions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateQuestionDto } from './dto/create-question.dto';

@ApiTags('questions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @Permissions('EXAM_MANAGE')
  @Get('stats')
  @ApiOperation({ summary: 'Get global question bank statistics', description: 'Permissions: EXAM_MANAGE' })
  getStats() {
    return this.questionsService.getStats();
  }

  @Permissions('EXAM_MANAGE')
  @Post()
  @ApiOperation({ summary: 'Create a new question for a lesson bank', description: 'Permissions: EXAM_MANAGE' })
  @ApiResponse({ status: 201, description: 'Question stored successfully.' })
  create(@Body() body: CreateQuestionDto, @Req() req: any) {
    return this.questionsService.create(body, req.user.id);
  }

  @Permissions('EXAM_MANAGE')
  @Get('lesson/:id')
  @ApiOperation({ summary: 'List all questions bound to a lesson', description: 'Permissions: EXAM_MANAGE' })
  @ApiResponse({ status: 200, description: 'List of questions returned.' })
  findByLesson(@Param('id') id: string) {
    return this.questionsService.findByLesson(id);
  }
}
