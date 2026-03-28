import { DbService } from '../../infrastructure/database/db.service';
export declare class PaymentsService {
    private readonly dbService;
    constructor(dbService: DbService);
    create(data: any): Promise<any>;
    getStudentPayments(studentId: string): Promise<{
        status: string;
        payments: any[];
    }>;
    findAll(): Promise<any[]>;
    remove(id: string): Promise<any>;
}
