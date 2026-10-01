import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    constructor(userRepository: Repository<User>);
    private allowFields;
    private hashPassword;
    create(createUserDto: CreateUserDto): Promise<({
        password: string;
        id: number;
        name: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    } & User) | undefined>;
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
    remove(id: number): Promise<string[]>;
    findOneByEmail(email: string): Promise<User | null>;
}
