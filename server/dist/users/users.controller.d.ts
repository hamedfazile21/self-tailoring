import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    create(createUserDto: CreateUserDto): Promise<({
        password: string;
        id: number;
        name: string;
        email: string;
        created_at: Date;
        updated_at: Date;
    } & import("./entities/user.entity").User) | undefined>;
    findAll(): Promise<import("./entities/user.entity").User[]>;
    findOne(id: number): Promise<import("./entities/user.entity").User>;
    update(id: number, updateUserDto: UpdateUserDto): Promise<import("./entities/user.entity").User | undefined>;
    remove(id: number): Promise<string[]>;
}
