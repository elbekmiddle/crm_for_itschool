import { Controller, Get, Post, Body, Param, UseGuards, Delete } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreatePaymentDto } from './dto/create-payment.dto';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Permissions('PAYMENT_CREATE')
  @Post()
  @ApiOperation({ summary: 'Register a new payment', description: 'Permissions: PAYMENT_CREATE' })
  create(@Body() body: CreatePaymentDto) {
    return this.paymentsService.create(body);
  }

  @Permissions('PAYMENT_READ')
  @Get('student/:id')
  @ApiOperation({ summary: 'Check student payment status and history', description: 'Permissions: PAYMENT_READ' })
  getStudentPayments(@Param('id') id: string) {
    return this.paymentsService.getStudentPayments(id);
  }

  @Permissions('PAYMENT_READ')
  @Get()
  @ApiOperation({ summary: 'Get all payments', description: 'Permissions: PAYMENT_READ' })
  findAll() {
    return this.paymentsService.findAll();
  }

  @Permissions('PAYMENT_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment', description: 'Permissions: PAYMENT_DELETE' })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}


