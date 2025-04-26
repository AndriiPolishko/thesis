import { Module } from "@nestjs/common";

import { LinkRepository } from "./link.repository";
import { LinkController } from "./link.controller";
import { DatabaseModule } from "../database/database.module";
import { LinkService } from "./link.service";

@Module({
  imports: [DatabaseModule],
  exports: [LinkRepository, LinkService],
  providers: [LinkRepository, LinkService],
  controllers: [LinkController],
})
export class LinkModule {}