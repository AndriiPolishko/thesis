import { Body, Controller, Get, Inject, Post, Query, Request } from "@nestjs/common";

import { CampaignService } from "./campaign.service";
import { Campaign, CampaignCreationResponse, CreateCampaignDto } from "./campaign.dto";

interface GetCampaignsResponse {
  campaigns: Campaign[];
  totalPages: number;
}

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

  @Get()
  async getCampaigns(@Query('page') page: number, @Query('size') size: number): Promise<GetCampaignsResponse> {
    const campaigns = await this.campaignService.getCampaigns(page, size);
    const totalPages = await this.campaignService.getTotalPages(size);

    return {
      campaigns,
      totalPages
    };
  }
}