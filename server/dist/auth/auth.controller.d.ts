import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(body: LoginAuthDto): Promise<{
        token: string;
    }>;
    logout(): Promise<string[]>;
}
