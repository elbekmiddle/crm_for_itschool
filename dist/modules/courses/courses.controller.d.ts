import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
export declare class CoursesController {
    private readonly coursesService;
    constructor(coursesService: CoursesService);
    create(body: CreateCourseDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
}
