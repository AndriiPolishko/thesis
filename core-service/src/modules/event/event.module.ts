import { Module } from "@nestjs/common";

import { EventService } from "./event.service";
import { EventRepository } from "./event.repository";
import { DatabaseModule } from "../database/database.module";
import { EventController } from "./event.controller";

@Module({
  imports: [DatabaseModule],
  controllers: [EventController],
  providers: [EventService, EventRepository],
  exports: [EventService, EventRepository]
})
export class EventModule {}