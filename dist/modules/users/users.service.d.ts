import { DbService } from '../../infrastructure/database/db.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
export declare class UsersService {
    private readonly dbService;
    private readonly cloudinaryService;
    constructor(dbService: DbService, cloudinaryService: CloudinaryService);
    create(data: any): Promise<any>;
    findAll(): Promise<any[]>;
    findOne(id: string): Promise<any>;
    update(id: string, data: any, file?: Express.Multer.File): Promise<any>;
    softDelete(id: string): Promise<{
        success: boolean;
    }>;
}
