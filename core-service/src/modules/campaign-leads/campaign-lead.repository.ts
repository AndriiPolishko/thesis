import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';

@Injectable()
export class CampaignLeadRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  public async getCampaignLeads(campaignId: string) {
    const query = `
      SELECT cl.*, l.*
      FROM "campaign_lead" cl
      JOIN "lead" l ON cl.lead_id = l.id
      WHERE cl.campaign_id = $1;
    `;
    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaignLeads = result.rows;

    return campaignLeads;
  }
}