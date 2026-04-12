import { Controller, Post, Get, Param, Body, UseGuards, Delete, ValidationPipe } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CreateLeadDto } from './dto/lead.dto';

@ApiTags('leads')
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Throttle({ default: { limit: 5, ttl: 300000 } })
  @Post()
  @ApiOperation({ summary: 'Create a new lead (Public)', description: 'No authentication required. Used for website contact form.' })
  createLead(@Body(new ValidationPipe()) data: CreateLeadDto) {
    return this.leadsService.createLead(data);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('STUDENT_CREATE')
  @Get()
  @ApiOperation({ summary: 'Get all leads', description: 'Permissions: STUDENT_CREATE' })
  getAllLeads() {
    return this.leadsService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('STUDENT_CREATE')
  @Post(':id/convert')
  @ApiOperation({ summary: 'Convert lead to student', description: 'Permissions: STUDENT_CREATE' })
  convertLead(@Param('id') id: string, @Body('branch_id') branchId: string, @Body('group_id') groupId: string) {
    return this.leadsService.convertLead(id, branchId, groupId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Permissions('STUDENT_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead', description: 'Permissions: STUDENT_DELETE' })
  deleteLead(@Param('id') id: string) {
    return this.leadsService.delete(id);
  }
}
