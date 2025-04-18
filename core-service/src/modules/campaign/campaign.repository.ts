import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { CampaignCreationResponse, CampaignCreationStatus, CreateCampaignEntity } from "./campaign.dto";
import { Campaign } from "./campaign.types";

// TODO: rename methods according to the repository pattern
@Injectable()
export class CampaignRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignEntity): Promise<CampaignCreationResponse> {
    try {
      const { name, goal, owner_id } = createCampaignDto;
      const query = `
        INSERT INTO campaign (name, goal, owner_id) VALUES ($1, $2, $3) RETURNING id`;

      const result = await this.databaseService.runQuery(query, [name, goal, owner_id]);
      const campaignId = Number(result.rows[0].id);

      return {
        id: campaignId,
        status: CampaignCreationStatus.Success
      };
    } catch (error) {
      console.log('error: ', error)

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
    const query = `
      SELECT * FROM campaign
      LIMIT $1 OFFSET $2`;

    const result = await this.databaseService.runQuery(query, [size, (Number(page) - 1) * size]);
    const campaigns: Campaign[] = result.rows;

    return campaigns;
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

    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaign: Campaign = result.rows[0];

    return campaign;
  }

  async activate(campaignId: number) {
    const query = `
      UPDATE campaign
      SET status = 'active'
      WHERE id = $1
      RETURNING *`;

    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaign: Campaign = result.rows[0];

    return campaign;
  }

  async deactivate(campaignId: number) {
    const query = `
      UPDATE campaign
      SET status = 'inactive'
      WHERE id = $1
      RETURNING *`;

    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaign: Campaign = result.rows[0];

    return campaign;
  }

  async findById(campaignId: number | string): Promise<Campaign> {
    const query = `
      SELECT * FROM campaign
      WHERE id = $1`;

    const result = await this.databaseService.runQuery(query, [campaignId]);
    const campaign: Campaign = result.rows[0];

    return campaign;
  }
}