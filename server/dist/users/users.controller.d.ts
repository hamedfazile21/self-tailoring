import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<{
        id: number;
        name: string;
        last_name: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    } | undefined>;
    findAll(page?: string, limit?: string, search?: string): Promise<{
        data: import("./entities/user.entity").User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<import("./entities/user.entity").User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User | undefined>;
    remove(ids: number[]): Promise<{
        message: string;
        affected: number;
    }>;
}
