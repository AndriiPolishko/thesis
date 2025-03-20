import { Inject, Injectable } from "@nestjs/common";

import { DatabaseService } from '../database/database.service';
import { Campaign, CampaignCreationResponse, CampaignCreationStatus, CreateCampaignEntity } from "./campaign.dto";


@Injectable()
export class CampaignRepository {
  constructor(
    @Inject(DatabaseService) private readonly databaseService: DatabaseService
  ) {}

  async createCampaign(createCampaignDto: CreateCampaignEntity): Promise<CampaignCreationResponse> {
    try {
      const { name, goal } = createCampaignDto;
      const query = `
        INSERT INTO campaign (name, goal) VALUES ($1, $2) RETURNING id`;

      const result = await this.databaseService.runQuery(query, [name, goal]);
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

  async getCampaigns(page: string, size: number) {
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
}