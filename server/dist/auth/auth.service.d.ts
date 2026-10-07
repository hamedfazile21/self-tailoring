import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from "../users/users.service";
import { JwtService } from '@nestjs/jwt';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    login(loginDto: LoginAuthDto): Promise<{
        token: string;
        user: {
            id: number;
            name: string;
            last_name: string;
            email: string;
            created_at: Date;
            updated_at: Date;
        };
    }>;
}
