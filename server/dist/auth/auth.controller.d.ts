import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginAuthDto): Promise<{
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
    logout(): Promise<string[]>;
}
