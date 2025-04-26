import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { CampaignCreationResponse, CampaignCreationStatus, CreateCampaignEntity } from "./campaign.dto";
import { Campaign } from "./campaign.types";

@Injectable()
export class CampaignRepository {
  private readonly logger = new Logger(CampaignRepository.name);

  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignEntity): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, owner_id, campaignSystemPrompt } = createCampaignDto;
      const query = `
        INSERT INTO campaign (name, goal, user_id, campaign_system_prompt) VALUES ($1, $2, $3, $4) RETURNING id`;

      const result = await this.databaseService.runQuery(query, [name, goal, owner_id, campaignSystemPrompt]);
      const campaignId = Number(result.rows[0].id);

      return {
        id: campaignId,
        status: CampaignCreationStatus.Success
      };
    } catch (error) {
      this.logger.error('Error creating campaign', error);

      return {
        status: CampaignCreationStatus.Error,
        errorText: error.message
      };
    }
  }

  async getAllCampaigns() {
    const result = await this.databaseService.runQuery('SELECT * FROM campaign');
    const campaigns: Campaign[] = result.rows;

    return campaigns;
  }

  async getCampaigns(page: number, size: number) {
    try {
      let query = `SELECT * FROM campaign`;
      const params: Array<number> = [];
  
      // If both page and size are provided and greater than zero, apply pagination
      if (page > 0 && size > 0) {
        query += ` LIMIT $1 OFFSET $2`;
        params.push(size, (page - 1) * size);
      }
  
      const result = await this.databaseService.runQuery(query, params);
      const campaigns: Campaign[] = result.rows;
      return campaigns;
    } catch (error) {
      this.logger.error('Error fetching campaigns', error);
      return [];
    }
  }

  async getTotalCampaigns() {
    const result = await this.databaseService.runQuery('SELECT COUNT(*) FROM campaign');
    const totalCampaigns = Number(result.rows[0].count);

    return totalCampaigns;
  }

  async getCampaign(campaignId: number) {
    const query = `
      SELECT * FROM campaign
      WHERE id = $1`;

    try {
      const result = await this.databaseService.runQuery(query, [campaignId]);
      const campaign: Campaign = result.rows[0];
  
      return campaign;
    } catch (error) {
      this.logger.error('Error fetching campaign', error);

      return null;
    }
  }

  async activate(campaignId: number) {
    const query = `
      UPDATE campaign
      SET status = 'active'
      WHERE id = $1
      RETURNING *`;

    try {
      const result = await this.databaseService.runQuery(query, [campaignId]);
      const campaign: Campaign = result.rows[0];
  
      return campaign;
    } catch (error) {
      this.logger.error('Error activating campaign', error);

      return null;
    }
  }

  async deactivate(campaignId: number) {
    const query = `
      UPDATE campaign
      SET status = 'inactive'
      WHERE id = $1
      RETURNING *`;
    
    try {
      const result = await this.databaseService.runQuery(query, [campaignId]);
      const campaign: Campaign = result.rows[0];
  
      return campaign;
    } catch (error) {
      this.logger.error('Error deactivating campaign', error);

      return null;
    }
  }

  async findById(campaignId: number | string): Promise<Campaign> {
    const query = `
      SELECT * FROM campaign
      WHERE id = $1`;

    try {
      const result = await this.databaseService.runQuery(query, [campaignId]);
      const campaign: Campaign = result.rows[0];
  
      return campaign;
    } catch (error) {
      this.logger.error('Error fetching campaign by ID', error);

      return null;
    }
  }
}