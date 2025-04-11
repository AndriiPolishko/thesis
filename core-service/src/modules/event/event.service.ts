import { Inject, Injectable } from "@nestjs/common";
import { EventRepository } from "./event.repository";

@Injectable()
export class EventService {
  constructor(
    @Inject(EventRepository) private readonly eventRepository: EventRepository
  ) {}

  public async getCampaignEvents(userId: number, campaignId: number) {
    const events = await this.eventRepository.getCampaignEvents({userId, campaignId});

    return events;
  }
}