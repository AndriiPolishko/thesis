import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { CreateEventDto, Event } from "./event.types";
import { DatabaseService } from "../database/database.service";

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
      INSERT INTO events (from, to, type, body, subject, thread_id, lead_id, campaign_id, campaign_lead_id, message_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    const result = await this.databaseService.runQuery(query, values);

    if (result.rows.length === 0) {
      this.logger.error("Failed to create event", result);

      return null;
    }

    return result.rows[0];
  }

  async getEventByThreadId(thread_id: string): Promise<Event[]> {
    const query = `
      SELECT * FROM events WHERE thread_id = ?;
    `;
    const values = [thread_id];
    const result = await this.databaseService.runQuery(query, values);

    if (result.rows.length === 0) {
      this.logger.log(`No events with ${thread_id} found`, result);

      return null;
    }

    return result.rows;
  }
}