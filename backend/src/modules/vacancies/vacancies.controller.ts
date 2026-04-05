import { Controller, Get, Post, Body, Param, Delete, UseGuards } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CreateVacancyDto, ApplyVacancyDto } from './dto/vacancy.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('vacancies')
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active vacancies (Public)' })
  getVacancies() { return this.vacanciesService.getVacancies(); }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('ANALYTICS_VIEW')
  @Post()
  @ApiOperation({ summary: 'Create a new vacancy', description: 'Permissions: ANALYTICS_VIEW' })
  createVacancy(@Body() data: CreateVacancyDto) {
    return this.vacanciesService.createVacancy(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('ANALYTICS_VIEW')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a vacancy', description: 'Permissions: ANALYTICS_VIEW' })
  deleteVacancy(@Param('id') id: string) {
    return this.vacanciesService.deleteVacancy(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply for a vacancy (Public)' })
  applyVacancy(@Body() dto: ApplyVacancyDto) {
     return this.vacanciesService.applyVacancy(dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Permissions('ANALYTICS_VIEW')
  @Get('applications')
  @ApiOperation({ summary: 'List all applications', description: 'Permissions: ANALYTICS_VIEW' })
  getApplications() { return this.vacanciesService.getApplications(); }
}
