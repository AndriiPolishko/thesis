import { Controller, Get, Request } from "@nestjs/common";

import { CampaignLeadService } from "./campaign-lead.service";

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
}