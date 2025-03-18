import { Module } from "@nestjs/common";

import { LinkRepository } from "./link.repository";
import { DatabaseModule } from "../database/database.module";

@Module({
  imports: [DatabaseModule],
  exports: [LinkRepository],
  providers: [LinkRepository]
})
export class LinkModule {}