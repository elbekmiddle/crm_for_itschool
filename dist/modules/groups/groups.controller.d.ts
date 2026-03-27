import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    create(body: CreateGroupDto): Promise<any>;
    addStudent(id: string, studentId: string): Promise<any>;
    removeStudent(id: string, studentId: string): Promise<{
        success: boolean;
    }>;
    getStudents(id: string): Promise<any[]>;
}
