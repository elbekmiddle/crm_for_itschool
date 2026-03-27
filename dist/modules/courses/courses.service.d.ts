import { DbService } from '../../infrastructure/database/db.service';
export declare class CoursesService {
    private readonly dbService;
    constructor(dbService: DbService);
    create(data: any): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
}
