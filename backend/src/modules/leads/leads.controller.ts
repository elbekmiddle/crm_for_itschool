import { Controller, Post, Get, Param, Body, UseGuards, Delete, ValidationPipe } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateLeadDto } from './dto/lead.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  createLead(@Body(new ValidationPipe()) data: CreateLeadDto) {
    return this.leadsService.createLead(data);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Get()
  getAllLeads() {
    return this.leadsService.findAll();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post(':id/convert')
  convertLead(@Param('id') id: string, @Body('branch_id') branchId: string) {
    return this.leadsService.convertLead(id, branchId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Delete(':id')
  deleteLead(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }
}
