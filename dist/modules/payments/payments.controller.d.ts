import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
export declare class PaymentsController {
    private readonly paymentsService;
    constructor(paymentsService: PaymentsService);
    create(body: CreatePaymentDto): Promise<any>;
    getStudentPayments(id: string): Promise<{
        status: string;
        payments: any[];
    }>;
    findAll(): Promise<any[]>;
    remove(id: string): Promise<any>;
}
