import { Body, Controller, Get, Inject, Patch, Post, Query, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

import { CampaignService, CampaignStatus } from "./campaign.service";
import { CampaignCreationResponse, CreateCampaignDto } from "./campaign.dto";
import { Campaign } from "./campaign.types";

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
  @UseGuards(AuthGuard('jwt'))
  async createCampaign(@Request() req, @Body() createCampaignDto: CreateCampaignDto): Promise<CampaignCreationResponse> {
    const userId = req?.user?.id;
    const { name, goal, urls, campaignSystemPrompt } = createCampaignDto;
    const status = await this.campaignService.createCampaign({ name, goal, owner_id: userId, urls, campaignSystemPrompt });

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