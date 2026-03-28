import { DbService } from '../../infrastructure/database/db.service';
export declare class GroupsService {
    private readonly dbService;
    constructor(dbService: DbService);
    create(data: any): Promise<any>;
    addStudent(groupId: string, studentId: string): Promise<any>;
    removeStudent(groupId: string, studentId: string): Promise<{
        success: boolean;
    }>;
    getStudents(groupId: string): Promise<any[]>;
    update(id: string, data: any): Promise<any>;
    softDelete(id: string): Promise<{
        success: boolean;
    }>;
    findAll(): Promise<any[]>;
}
