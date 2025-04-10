import { Body, Controller, Get, Post, Request, UseGuards } from "@nestjs/common";

import { CampaignLeadService } from "./campaign-lead.service";
import { AuthGuard } from "@nestjs/passport";
import { AddCampaignLeadsBody } from "./campaign-lead.types";

@Controller("campaign-lead")
export class CampaignLeadController {
  constructor(
    private readonly campaignLeadService: CampaignLeadService
  ) {}

  @Get("/:campaignId")
  async getCampaignLeads(@Request() req) {
    const { campaignId } = req.params;
    const campaignLeads = await this.campaignLeadService.getCampaignLeads(campaignId);
    
    return {
      campaignLeads
    }
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async addCampaignLeads(@Request() req, @Body() body: AddCampaignLeadsBody) {
    const userId = req?.user?.id;
    const { campaignId, leadIds } = body;

    const result = await this.campaignLeadService.addCampaignLeads({ userId, campaignId, leadIds });

    return result;
  }
}