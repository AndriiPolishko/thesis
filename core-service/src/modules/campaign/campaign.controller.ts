import { Body, Controller, Get, Inject, Patch, Post, Query, Request } from "@nestjs/common";

import { CampaignService, CampaignStatus } from "./campaign.service";
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

  @Get("/:id")
  async getCampaign(@Request() req): Promise<Campaign> {
    const campaignId = req.params.id;
    const campaign = await this.campaignService.getCampaign(campaignId);

    return campaign;
  }

  @Patch("/change-status/:id")
  async changeCampaignStatus(@Request() req, @Body() toggleCampaignStatusBody: { newStatus: CampaignStatus }): Promise<Campaign> {
    const campaignId = req.params.id;
    const { newStatus } = toggleCampaignStatusBody;
    const campaign = await this.campaignService.changeCampaignStatus({ campaignId, newStatus });

    return campaign;
  }
}