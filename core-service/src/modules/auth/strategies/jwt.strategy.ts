import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from 'src/modules/user/user.repository';
import { Request } from 'express';


@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          console.log('Extracting JWT from cookies:', req.cookies);
          const access_token = req?.cookies?.['access_token'];

          if (access_token) {
            console.log('Token found:', access_token.substring(0, 20) + '...');
            try {
              // Just for debugging - Try to decode it yourself
              const decoded = require('jsonwebtoken').decode(access_token);
              console.log('Token can be decoded:', !!decoded);
              console.log('Token payload:', decoded);
            } catch (e) {
              console.log('Token decode error:', e.message);
            }
          } else {
            console.log('No token found in cookies');
          }

          return access_token;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: 'default_jwt_secret', // configService.get<string>('JWT_SECRET') || 'default_jwt_secret'
    });
  }

  async validate(payload: any) {
    console.log('Decoded JWT payload:', payload);

    const userId = payload.sub;
    const user = await this.userRepository.findOne(userId);

    return user;
  }
}