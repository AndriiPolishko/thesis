import { Controller, Get, Inject, Query, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";

import { User } from "src/modules/user/user.types";
import { EventService } from "./event.service";
import { Event } from "./event.types";

@Controller("event")
export class EventController {
  constructor(
    @Inject(EventService) private readonly eventService: EventService
  ) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getEvents(@Req() req: Request, @Query('campaignId') campaignId: number): Promise<{ events: Event[]}> {
    const user = req?.user as User;
    const userId = user?.id;
    const events = await this.eventService.getCampaignEvents(userId, campaignId);

    return { events };
  }
}