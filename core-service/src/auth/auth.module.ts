import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from 'src/modules/user/user.module';
import { IntegrationTokenModule } from 'src/modules/integrationToken/integration-token.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [UserModule, IntegrationTokenModule,
    JwtModule.register({
      secret: 'default_jwt_secret', // process.env.JWT_SECRET || 'your_jwt_secret',
      signOptions: { expiresIn: '15m' },
    }),
  ],
  providers: [AuthService, GoogleStrategy, JwtStrategy],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
