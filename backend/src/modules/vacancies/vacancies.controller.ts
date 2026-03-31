import { Controller, Get, Post, Body, Param, Delete, UseGuards, ValidationPipe } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateVacancyDto, ApplyVacancyDto } from './dto/vacancy.dto';

@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly v: VacanciesService) {}

  @Get()
  getVacancies() { return this.v.getVacancies(); }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  createVacancy(@Body(new ValidationPipe()) b: CreateVacancyDto) { return this.v.createVacancy(b); }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  deleteVacancy(@Param('id') id: string) { return this.v.deleteVacancy(id); }

  @Post('apply')
  applyVacancy(@Body(new ValidationPipe()) b: ApplyVacancyDto) { return this.v.applyVacancy(b); }

  @Get('applications')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  getApplications() { return this.v.getApplications(); }
}
