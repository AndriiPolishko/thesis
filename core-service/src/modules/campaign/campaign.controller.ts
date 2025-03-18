import { Body, Controller, Get, Inject, Post } from "@nestjs/common";

import { CampaignService } from "./campaign.service";
import { Campaign, CampaignCreationResponse, CreateCampaignDto } from "./campaign.dto";

@Controller("campaign")
export class CampaignController {
  constructor(
    @Inject(CampaignService) private readonly campaignService: CampaignService
  ) {}

  @Post('create')
  async createCampaign(@Body() createCampaignDto: CreateCampaignDto): Promise<CampaignCreationResponse> {
    const status = await this.campaignService.createCampaign(createCampaignDto);

    return status;
  }

  @Get('all')
  async getAllCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.campaignService.getAllCampaigns();

    return campaigns;
  }
}