import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { CampaignLeadJoinLead, AddCampaignLeadsParams, CampaignLeadStatus } from './campaign-lead.types';

interface AddCampaignLeadToDatabaseParams {
  campaignId: number;
  leadId: number;
  userId: number;
}

@Injectable()
export class CampaignLeadRepository {
  private readonly logger = new Logger(CampaignLeadRepository.name);

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
      c.goal AS campaign_goal,
      c.campaign_system_prompt AS campaign_system_prompt
      FROM "campaign_lead" cl
      JOIN "lead" l ON cl.lead_id = l.id
      JOIN "campaign" c ON cl.campaign_id = c.id
      WHERE cl.campaign_id = $1;
    `;
    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaignLeads: CampaignLeadJoinLead[] = result.rows;

    return campaignLeads;
  }

  public async findByCampaignIdAndLeadId(campaignId: number, leadId: number): Promise<CampaignLeadJoinLead> {
    const query = `
      SELECT *
      FROM "campaign_lead" cl
      WHERE cl.campaign_id = $1 AND cl.lead_id = $2;
    `;
    const result = await this.databaseService.runQuery(query, [campaignId, leadId]);
    const campaignLead: CampaignLeadJoinLead = result.rows[0];

    return campaignLead;
  }

  public async addCampaignLead(params: AddCampaignLeadToDatabaseParams){
    const { userId, campaignId, leadId } = params;

    try {
      const query = `
        INSERT INTO campaign_lead (campaign_id, lead_id)
        VALUES ($1, $2)
        RETURNING *;`;
      const values = [campaignId, leadId];

      this.logger.log(`Start adding campaign lead for user ${userId} with campaignId: ${campaignId} and leadId: ${leadId}`)

      const result = await this.databaseService.runQuery(query, values);
      const campaignLead: CampaignLeadJoinLead = result.rows[0];

      this.logger.log(`Success on adding campaign lead ${campaignLead.id} for user ${userId} with campaignId: ${campaignId} and leadId: ${leadId}`);

      return campaignLead;
    } catch (error) {
      this.logger.error(`Error on adding campaign lead for user ${userId} with campaignId: ${campaignId} and leadId: ${leadId}`, error);
    }
  }

  public async updateStatus(campaignLeadId: number, status: CampaignLeadStatus): Promise<void> {
    const query = `
      UPDATE campaign_lead
      SET status = $2
      WHERE id = $1;
    `;
    const values = [campaignLeadId, status];

    try {
      await this.databaseService.runQuery(query, values);
      
      this.logger.log(`Successfully updated status for campaign lead ${campaignLeadId} to ${status}`);
    } catch (error) {
      this.logger.error(`Error updating status for campaign lead ${campaignLeadId} to ${status}`, error);
    }
  }

  public async removeCampaignLead(campaignLeadId: number): Promise<void> {
    const query = `
      DELETE FROM campaign_lead
      WHERE id = $1;
    `;
    const values = [campaignLeadId];

    try {
      await this.databaseService.runQuery(query, values);
      
      this.logger.log(`Successfully removed campaign lead ${campaignLeadId}`);
    } catch (error) {
      this.logger.error(`Error removing campaign lead ${campaignLeadId}`, error);
    }
  }
}