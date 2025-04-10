import { Module } from "@nestjs/common";

import { IntegrationTokenRepository } from "./integration-token.repository";
import { DatabaseModule } from "../database/database.module";
import { IntegrationTokenService } from "./integration-token.service";

@Module({
  imports: [DatabaseModule],
  providers: [IntegrationTokenRepository, IntegrationTokenService],
  exports: [IntegrationTokenRepository, IntegrationTokenService]
})
export class IntegrationTokenModule {}