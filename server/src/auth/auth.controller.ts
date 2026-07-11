import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() body: LoginAuthDto) {
    return this.authService.login(body);
  }

  @HttpCode(HttpStatus.OK)
  @Post('logout')
  async logout() {
    // Client-side handles deleting the JWT token from storage.
    return ['Logged out successfully'];
  }
}
