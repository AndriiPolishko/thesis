import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { CampaignLeadJoinLead } from './campaign-lead.types';

@Injectable()
export class CampaignLeadRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  public async getCampaignLeads(campaignId: number): Promise<CampaignLeadJoinLead[]> {
    const query = `
      SELECT cl.*,
      l.status AS lead_status,
      l.created_at AS lead_created_at,
      l.updated_at AS lead_updated_at,
      l.first_name,
      l.last_name,
      l.email,
      c.goal AS campaign_goal
      FROM "campaign_lead" cl
      JOIN "lead" l ON cl.lead_id = l.id
      JOIN "campaign" c ON cl.campaign_id = c.id
      WHERE cl.campaign_id = $1;
    `;
    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaignLeads: CampaignLeadJoinLead[] = result.rows;

    return campaignLeads;
  }
}