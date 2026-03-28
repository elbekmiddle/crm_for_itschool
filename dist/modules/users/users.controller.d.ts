import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(body: CreateUserDto): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string, req: any): Promise<any>;
    update(id: string, body: UpdateUserDto, req: any): Promise<any>;
    remove(id: string): Promise<any>;
}
