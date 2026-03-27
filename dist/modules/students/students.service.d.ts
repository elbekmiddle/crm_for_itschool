import { DbService } from '../../infrastructure/database/db.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsService {
    private readonly dbService;
    constructor(dbService: DbService);
    create(createStudentDto: CreateStudentDto, createdBy: string): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any[];
        meta: {
            total: number;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findOne(id: string): Promise<any>;
    update(id: string, updateStudentDto: UpdateStudentDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
    enroll(studentId: string, courseId: string): Promise<any>;
}
