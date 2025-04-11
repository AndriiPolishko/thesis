import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { CreateEventDto, Event, EventJoinedWithLead } from "./event.types";
import { DatabaseService } from "../database/database.service";

interface GetCampaignEventsParams { 
  userId: number;
  campaignId: number 
}



@Injectable()
export class EventRepository {
  private readonly logger = new Logger(EventRepository.name);

  constructor(
    @Inject(DatabaseService)
    private readonly databaseService: DatabaseService,
  ) {}

  async createEvent(event: CreateEventDto): Promise<Event> {
    const {
      from,
      to,
      type,
      body,
      subject,
      thread_id,
      lead_id,
      campaign_id,
      campaign_lead_id,
      message_id,
    } = event;
    const query = `
      INSERT INTO event ("from", "to", type, body, subject, thread_id, lead_id, campaign_id, campaign_lead_id, message_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      from,
      to,
      type,
      body,
      subject,
      thread_id,
      lead_id,
      campaign_id,
      campaign_lead_id,
      message_id,
    ];

    try {
      const result = await this.databaseService.runQuery(query, values);

      if (result.rows.length === 0) {
        this.logger.error("Failed to create event", result);
  
        return null;
      }
  
      return result.rows[0];
    } catch (error) {
      this.logger.error("Error creating event", query , values, error);

      return null;
    }
    
  }
  async getEventByThreadId(thread_id: string): Promise<Event[]> {
    const query = `
      SELECT * FROM event WHERE thread_id = $1;
    `;
    const values = [thread_id];
  
    try {
      const result = await this.databaseService.runQuery(query, values);
  
      if (result.rows.length === 0) {
        this.logger.log(`No events with thread_id=${thread_id} found`);
        return null;
      }
  
      return result.rows;
    } catch (error) {
      this.logger.error("Error fetching events by thread_id", query, values, error);
      return null;
    }
  }

  public async getCampaignEvents(params: GetCampaignEventsParams): Promise<EventJoinedWithLead[]> {
    const { userId, campaignId } = params;
    const query = `
        SELECT event.*, l.first_name, l.last_name
        FROM event
        LEFT JOIN lead l ON event.lead_id = l.id
        WHERE campaign_id = $1;
      `
    const values = [campaignId];

    try {
      const result = await this.databaseService.runQuery(query, values);
      const events: EventJoinedWithLead[] = result.rows;

      this.logger.log(`Total events for user ${userId} and campaign ${campaignId}: ${events.length}`);

      return events;
    }
    catch (error) {
      this.logger.error(`Error fetching events for user ${userId} and campaign ${campaignId}`, error);
      
      return null;
    }
  }
  
}