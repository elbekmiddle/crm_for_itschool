import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('ai')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Get('status')
  @ApiOperation({ summary: 'AI kalitlari (qiymatlar qaytarilmaydi)' })
  aiStatus() {
    return {
      ai_configured: this.aiService.isConfigured(),
      openai_configured: this.aiService.hasOpenAi(),
      gemini_configured: this.aiService.hasGemini(),
      active_provider: this.aiService.getActiveProvider(),
    };
  }

  @Roles('ADMIN', 'MANAGER', 'TEACHER')
  @Post('analyze-student')
  @ApiOperation({ summary: 'AI: talaba holati bo‘yicha qisqa tahlil (OpenAI yoki Gemini)' })
  @ApiBody({ schema: { type: 'object', properties: { summaryData: { type: 'object' } } } })
  @ApiResponse({ status: 201, description: 'Humorous AI string response.' })
  analyzeStudent(@Body() body: any) {
    return this.aiService.analyzeStudent(body);
  }

  @Roles('ADMIN', 'MANAGER')
  @Post('group-summary')
  @ApiOperation({ summary: 'AI: guruh bo‘yicha qisqa xulosa (OpenAI yoki Gemini)' })
  @ApiBody({ schema: { type: 'object', properties: { groupData: { type: 'object' } } } })
  @ApiResponse({ status: 201, description: 'Actionable humorous summary.' })
  groupSummary(@Body() body: any) {
    return this.aiService.groupSummary(body);
  }
}
