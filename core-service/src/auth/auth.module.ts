import { Module } from '@nestjs/common';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { UserModule } from 'src/user/user.module';
import { SessionSerializer } from './serializer/serializer';
import { IntegrationTokenModule } from 'src/modules/integrationToken/integration-token.module'; 

@Module({
  imports: [UserModule, IntegrationTokenModule],
  providers: [AuthService, GoogleStrategy, SessionSerializer],
  exports: [AuthService],
  controllers: [AuthController]
})
export class AuthModule {}
