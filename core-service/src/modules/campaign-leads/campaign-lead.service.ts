import { Injectable } from "@nestjs/common";

import { CampaignLeadRepository } from "./campaign-lead.repository";

@Injectable()
export class CampaignLeadService {
  constructor(
    private readonly campaignLeadRepository: CampaignLeadRepository
  ) {}

  public async getCampaignLeads(campaignId: string) {
    const campaignLeads = await this.campaignLeadRepository.getCampaignLeads(campaignId);

    return campaignLeads;
  }
}