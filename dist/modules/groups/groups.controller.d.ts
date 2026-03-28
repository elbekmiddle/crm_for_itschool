import { GroupsService } from './groups.service';
import { CreateGroupDto } from './dto/create-group.dto';
import { UpdateGroupDto } from './dto/update-group.dto';
export declare class GroupsController {
    private readonly groupsService;
    constructor(groupsService: GroupsService);
    findAll(): Promise<any[]>;
    create(body: CreateGroupDto): Promise<any>;
    addStudent(id: string, studentId: string): Promise<any>;
    removeStudent(id: string, studentId: string): Promise<{
        success: boolean;
    }>;
    getStudents(id: string): Promise<any[]>;
    update(id: string, body: UpdateGroupDto): Promise<any>;
    remove(id: string): Promise<{
        success: boolean;
    }>;
}
