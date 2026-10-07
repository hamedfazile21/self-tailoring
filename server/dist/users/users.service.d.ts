import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    private allowFields;
    private hashPassword;
    create(createUserDto: CreateUserDto): Promise<{
        id: number;
        name: string;
        last_name: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    } | undefined>;
    findAll(page?: number, limit?: number, search?: string): Promise<{
        data: User[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    findOne(id: number): Promise<User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<User | undefined>;
    remove(ids: number[]): Promise<{
        message: string;
        affected: number;
    }>;
    findOneByEmail(email: string): Promise<User | null>;
}
