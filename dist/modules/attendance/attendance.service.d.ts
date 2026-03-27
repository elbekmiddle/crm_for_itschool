import { DbService } from '../../infrastructure/database/db.service';
export declare class AttendanceService {
    private readonly dbService;
    constructor(dbService: DbService);
    markAttendance(data: any): Promise<any>;
    getGroupAttendance(groupId: string): Promise<any[]>;
}
