import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    create(createStudentDto: CreateStudentDto, req: any): Promise<any>;
    findAll(page: string, limit: string): Promise<{
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
    enroll(id: string, courseId: string): Promise<any>;
}
