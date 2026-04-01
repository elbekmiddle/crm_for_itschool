import { Controller, Get, Post, Body, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { VacanciesService } from './vacancies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateVacancyDto, ApplyVacancyDto } from './dto/vacancy.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('vacancies')
@Controller('vacancies')
export class VacanciesController {
  constructor(private readonly vacanciesService: VacanciesService) {}

  @Get()
  getVacancies() { return this.vacanciesService.getVacancies(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  createVacancy(@Body() data: CreateVacancyDto) {
    return this.vacanciesService.createVacancy(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  deleteVacancy(@Param('id') id: string) {
    return this.vacanciesService.deleteVacancy(id);
  }

  @Post('apply')
  @ApiOperation({ summary: 'Apply for a vacancy' })
  applyVacancy(@Body() dto: ApplyVacancyDto) {
     return this.vacanciesService.applyVacancy(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Get('applications')
  @ApiOperation({ summary: 'List all vacancy applications for Admins/Managers' })
  getApplications() { return this.vacanciesService.getApplications(); }
}
