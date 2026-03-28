import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(body: CreateCourseDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    getStudents(id: string): Promise<any[]>;
    update(id: string, body: UpdateCourseDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
