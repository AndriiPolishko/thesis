import { Module } from "@nestjs/common";

import { IntegrationTokenRepository } from "./integration-token.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [IntegrationTokenRepository],
  exports: [IntegrationTokenRepository]
})
export class IntegrationTokenModule {}