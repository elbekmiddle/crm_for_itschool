import { AttendanceService } from './attendance.service';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
export declare class AttendanceController {
    private readonly attendanceService;
    constructor(attendanceService: AttendanceService);
    markAttendance(body: CreateAttendanceDto): Promise<any>;
    getGroupAttendance(id: string): Promise<any[]>;
    update(id: string, status: string): Promise<any>;
}
