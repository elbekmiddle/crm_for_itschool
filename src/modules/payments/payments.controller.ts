import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles('ADMIN', 'MANAGER')
  @Post()
  @ApiOperation({ summary: 'Register a new payment' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        student_id: { type: 'string', example: 'uuid-student' },
        group_id: { type: 'string', example: 'uuid-group' },
        amount: { type: 'number', example: 100 }
      }
    }
  })
  @ApiResponse({ status: 201, description: 'Payment recorded and history updated.' })
  create(@Body() body: CreatePaymentDto) {
    return this.paymentsService.create(body);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('student/:id')
  @ApiOperation({ summary: 'Check student payment status and history' })
  @ApiParam({ name: 'id', description: 'Student UUID' })
  @ApiResponse({ status: 200, description: 'Returns { status: ACTIVE|FROZEN, payments: [...] }.' })
  getStudentPayments(@Param('id') id: string) {
    return this.paymentsService.getStudentPayments(id);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get()
  @ApiOperation({ summary: 'Get all payments' })
  @ApiResponse({ status: 200, description: 'Returns all payments.' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment' })
  @ApiParam({ name: 'id', description: 'Payment UUID' })
  @ApiResponse({ status: 200, description: 'Payment deleted.' })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}


