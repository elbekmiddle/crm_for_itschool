import { Controller, Get, Post, Patch, Body, Param, UseGuards, Delete, Query, Request, ForbiddenException } from '@nestjs/common';
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
  getStudentPayments(@Param('id') id: string, @Request() req: { user?: { id?: string; role?: string } }) {
    if (req.user?.role === 'STUDENT' && id !== req.user.id) {
      throw new ForbiddenException("Faqat o'z to'lovlaringizni ko'ra olasiz");
    }
    return this.paymentsService.getStudentPayments(id);
  }

  @Permissions('PAYMENT_READ')
  @Get()
  @ApiOperation({
    summary: 'To‘lovlar ro‘yxati (sahifalangan)',
    description: 'Permissions: PAYMENT_READ. `page` (default 1), `limit` (default 50, max 100).',
  })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = Math.max(1, parseInt(page ?? '1', 10) || 1);
    const l = Math.min(100, Math.max(1, parseInt(limit ?? '50', 10) || 50));
    return this.paymentsService.findAllPaged(p, l);
  }

  @Permissions('PAYMENT_READ')
  @Get('debtors')
  @ApiOperation({ summary: 'Talabalar: qarz (to‘lov yo‘q yoki 60+ kun)', description: 'Permissions: PAYMENT_READ' })
  listDebtors() {
    return this.paymentsService.listDebtors();
  }

  @Permissions('PAYMENT_UPDATE')
  @Patch(':id')
  @ApiOperation({ summary: "To'lov yozuvini tahrirlash", description: 'Permissions: PAYMENT_UPDATE' })
  update(
    @Param('id') id: string,
    @Body() body: { amount?: number; paid_at?: string; description?: string | null; student_id?: string },
  ) {
    return this.paymentsService.updatePayment(id, body);
  }

  @Permissions('PAYMENT_DELETE')
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a payment', description: 'Permissions: PAYMENT_DELETE' })
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}


