import { Inject, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Logger } from '@nestjs/common';

import { UserRepository } from 'src/modules/user/user.repository';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(configService: ConfigService,
    @Inject(UserRepository) private readonly userRepository: UserRepository,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => {
          const access_token = req?.cookies?.['access_token'];

          if (access_token) {
            try {
              // Just for debugging - Try to decode it yourself
              const decoded = require('jsonwebtoken').decode(access_token);
            } catch (error) {
              this.logger.error('Failed to decode JWT', error);
            }
          }

          return access_token;
        }
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')
    });
  }

  async validate(payload: any) {
    const userId = payload.sub;
    const user = await this.userRepository.findOne(userId);

    return user;
  }
}