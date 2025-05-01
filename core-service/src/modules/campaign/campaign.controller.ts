import { Body, Controller, Delete, Get, Inject, Patch, Post, Query, Req, Request, UseGuards } from "@nestjs/common";
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
  @UseGuards(AuthGuard('jwt'))
  async getAllCampaigns(@Req() req): Promise<Campaign[]> {
    const userId = req?.user?.id;
    const campaigns = await this.campaignService.getAllCampaigns(userId);

    return campaigns;
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async getCampaigns(@Req() req, @Query('page') page: number, @Query('size') size: number): Promise<GetCampaignsResponse> {
    const userId = req?.user?.id;
    const campaigns = await this.campaignService.getCampaigns(page, size, userId);
    const totalPages = await this.campaignService.getTotalPages(size, userId);

    return {
      campaigns,
      totalPages
    };
  }

  @Get("/:id")
  @UseGuards(AuthGuard('jwt'))
  async getCampaign(@Request() req): Promise<Campaign> {
    const campaignId = req.params.id;
    const campaign = await this.campaignService.getCampaign(campaignId);

    return campaign;
  }

  @Patch("/change-status/:id")
  @UseGuards(AuthGuard('jwt'))
  async changeCampaignStatus(@Request() req, @Body() toggleCampaignStatusBody: { newStatus: CampaignStatus }): Promise<Campaign> {
    const campaignId = req.params.id;
    const { newStatus } = toggleCampaignStatusBody;
    const campaign = await this.campaignService.changeCampaignStatus({ campaignId, newStatus });

    return campaign;
  }

  @Delete("/:id")
  @UseGuards(AuthGuard('jwt'))
  async deleteCampaign(@Request() req): Promise<{ message: string }> {
    const userId = req?.user?.id;
    const campaignId = req.params.id;
    await this.campaignService.deleteCampaign({campaignId, userId});

    return {
      message: "Campaign deleted successfully"
    };
  }
}