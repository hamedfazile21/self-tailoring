import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Expects "Bearer <Token>"
      ignoreExpiration: false,
      secretOrKey: 'YOUR_SUPER_SECRET_KEY',
    });
  }

  // Whatever this function returns is automatically injected into request.user
  async validate(payload: any) {
    return { user_id: payload.sub, email: payload.email };
  }
}
